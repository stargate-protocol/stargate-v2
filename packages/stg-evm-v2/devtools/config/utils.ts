import assert from 'assert'
import * as fs from 'fs'

import {
    CreditMessagingNetworkConfig,
    SafeConfig,
    StargateType,
    TokenMessagingNetworkConfig,
    TokenName,
    getNetworkConfig,
} from '@stargatefinance/stg-definitions-v2'
import { MSG_TYPE_BUS, MSG_TYPE_CREDIT_MESSAGING, MSG_TYPE_TAXI } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { AssetEdgeConfig, CreditMessagingEdgeConfig, TokenMessagingEdgeConfig } from '@stargatefinance/stg-devtools-v2'
import * as yaml from 'js-yaml'

import { formatEid, withEid } from '@layerzerolabs/devtools'
import { OmniEdgeHardhat, OmniPointHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'

import { getAssetNetworkConfig } from '../../ts-src/utils/util'

/**
 * Generates a mesh of connections based on points without any loopbacks
 *
 * @template TEdgeConfig
 * @param {OmniPointHardhat[]} points
 * @param {(from: OmniPointHardhat, to: OmniPointHardhat) => TEdgeConfig} getConfig Returns a config between `from` and `to`
 * @returns
 */
export const generateDefaultConnections = <TEdgeConfig>(
    points: OmniPointHardhat[],
    getConfig: (from: OmniPointHardhat, to: OmniPointHardhat) => TEdgeConfig
): OmniEdgeHardhat<TEdgeConfig>[] =>
    points.flatMap((from) =>
        points.flatMap((to) => (from.eid === to.eid ? [] : [{ from, to, config: getConfig(from, to) }]))
    )

// asset config
export const generateAssetConfig = (
    tokenName: TokenName,
    points: OmniPointHardhat[]
): OmniEdgeHardhat<AssetEdgeConfig>[] =>
    generateDefaultConnections(points, (_, to) => {
        const assetNetworkConfig = getAssetNetworkConfig(to.eid, tokenName)
        const config: AssetEdgeConfig = {
            isOFT: assetNetworkConfig.type === StargateType.Oft,
        }
        return config
    })

// credit messaging config
export const generateCreditMessagingConfig = (
    points: OmniPointHardhat[]
): OmniEdgeHardhat<CreditMessagingEdgeConfig>[] =>
    generateDefaultConnections(points, (from, to) =>
        toCreditMessagingEdgeConfig(
            assertAndReturn(
                getNetworkConfig(to.eid).creditMessaging,
                `CreditMessaging config not defined for ${formatEid(to.eid)}`
            ),
            assertAndReturn(
                getNetworkConfig(from.eid).creditMessaging,
                `CreditMessaging config not defined for ${formatEid(from.eid)}`
            )
        )
    )

const toCreditMessagingEdgeConfig = (
    toConfig: CreditMessagingNetworkConfig,
    fromConfig: CreditMessagingNetworkConfig
): CreditMessagingEdgeConfig => ({
    gasLimit: toConfig.sendCreditGasLimit, // marginal gas limit
    enforcedOptions: [
        {
            msgType: MSG_TYPE_CREDIT_MESSAGING,
            optionType: ExecutorOptionType.LZ_RECEIVE,
            gas: toConfig.creditGasLimit, // fixed gasLimit
        },
    ],
    sendConfig: {
        executorConfig: fromConfig.executor
            ? {
                  maxMessageSize: 10000,
                  executor: fromConfig.executor,
              }
            : undefined,
        ulnConfig: {
            requiredDVNs: fromConfig.requiredDVNs ?? [],
            confirmations: fromConfig.confirmations,
        },
    },
    receiveConfig: {
        ulnConfig: {
            requiredDVNs: fromConfig.requiredDVNs ?? [],
            confirmations: fromConfig.confirmations,
        },
    },
})

// token messaging config
export const generateTokenMessagingConfig = (points: OmniPointHardhat[]): OmniEdgeHardhat<TokenMessagingEdgeConfig>[] =>
    generateDefaultConnections(points, (from, to) =>
        toTokenMessagingEdgeConfig(
            assertAndReturn(
                getNetworkConfig(to.eid).tokenMessaging,
                `TokenMessaging config not defined for ${formatEid(to.eid)}`
            ),
            assertAndReturn(
                getNetworkConfig(from.eid).tokenMessaging,
                `TokenMessaging config not defined for ${formatEid(to.eid)}`
            )
        )
    )

const toTokenMessagingEdgeConfig = (
    toConfig: TokenMessagingNetworkConfig,
    fromConfig: TokenMessagingNetworkConfig
): TokenMessagingEdgeConfig => ({
    maxPassengers: toConfig.maxPassengerCount,
    gasLimit: {
        gasLimit: toConfig.busRideGasLimit,
        nativeDropGasLimit: toConfig.nativeDropGasLimit,
    },
    nativeDropAmount: toConfig.nativeDropAmount,
    enforcedOptions: [
        {
            msgType: MSG_TYPE_TAXI,
            optionType: ExecutorOptionType.LZ_RECEIVE,
            gas: toConfig.taxiGasLimit,
        },
        {
            msgType: MSG_TYPE_BUS,
            optionType: ExecutorOptionType.LZ_RECEIVE,
            gas: toConfig.busGasLimit,
        },
    ],
    sendConfig: {
        executorConfig: fromConfig.executor
            ? {
                  maxMessageSize: 10000,
                  executor: fromConfig.executor,
              }
            : undefined,
        ulnConfig: {
            requiredDVNs: fromConfig.requiredDVNs ?? [],
            confirmations: fromConfig.confirmations,
        },
    },
    receiveConfig: {
        ulnConfig: {
            requiredDVNs: fromConfig.requiredDVNs ?? [],
            confirmations: fromConfig.confirmations,
        },
    },
})

/**
 * Returns the gnosis safe config for a particular network.
 *
 * If safe is not configured, will return `undefined`.
 * If network is not configured, will throw an exception.
 *
 * @param {EndpointId} eid
 * @returns {SafeConfig | undefined}
 */
export const getSafeConfigMaybe = (eid: EndpointId): SafeConfig | undefined => getNetworkConfig(eid).safeConfig

/**
 * Returns the gnosis safe config for a particular network.
 *
 * If safe or network are not configured, will throw an exception.
 *
 * @param {EndpointId} eid
 * @returns {SafeConfig}
 */
export const getSafeConfig = (eid: EndpointId): SafeConfig => {
    const safeConfig = getSafeConfigMaybe(eid)

    return assert(safeConfig != null, `Missing safe config for ${formatEid(eid)}`), safeConfig
}

/**
 * Returns the gnosis safe address configured for a particular network.
 *
 * If safe is not configured, will return `undefined`.
 * If network is not configured, will throw an exception.
 *
 * @param {EndpointId} eid
 * @returns {string | undefined}
 */
export const getSafeAddressMaybe = (eid: EndpointId): string | undefined => getSafeConfigMaybe(eid)?.safeAddress

/**
 * Returns the gnosis safe address configured for a particular network.
 *
 * If safe or network are not configured, will throw an exception.
 *
 * @param {EndpointId} eid
 * @returns {string}
 */
export const getSafeAddress = (eid: EndpointId): string => getSafeConfig(eid).safeAddress

/**
 * Tiny helper around non-null assert
 */
const assertAndReturn = <T>(value: T | null | undefined, message: string): T => (assert(value != null, message), value)

export function getContractsInChain(
    chains: string[] | null,
    contract: any,
    isValidChain: (chain: string) => boolean,
    chainEids: any
) {
    if (!chains || chains.length === 0) {
        // If chains is null or empty, include all valid contracts
        return Object.keys(chainEids)
            .filter(isValidChain)
            .map((chain) => withEid(chainEids[chain as keyof typeof chainEids])(contract))
    }

    const invalidChains = chains.filter((chain) => !isValidChain(chain.trim()))
    if (invalidChains.length > 0) {
        throw new Error(`Invalid chains found: ${invalidChains.join(', ')}`)
    }

    return chains.map((chain) => getContractWithEid(chainEids[chain.trim() as keyof typeof chainEids], contract))
}

export function filterConnections(connections: any[], fromContracts: any[], toContracts: any[]) {
    const fromEids = new Set(fromContracts.map((contract: { eid: any }) => contract.eid))
    const toEids = new Set(toContracts.map((contract: { eid: any }) => contract.eid))

    return connections.filter((connection: { from: { eid: any }; to: { eid: any } }) => {
        return fromEids.has(connection.from.eid) && toEids.has(connection.to.eid)
    })
}

export function getContractWithEid(eid: EndpointId, contract: any) {
    return withEid(eid)(contract)
}

/**
 * Returns the difference between two sets
 * @param setA - The first set
 * @param setB - The second set
 * @returns A new set containing elements that are in setA but not in setB
 */
export function setsDifference(setA: Set<string>, setB: Set<string>): Set<string> {
    return new Set<string>([...setA].filter((x) => !setB.has(x)))
}

interface Token {
    type: string
}

interface RewarderToken {
    allocation: Record<string, number>
}

export interface Chain {
    name: string
    eid: any
    token_messaging: boolean
    credit_messaging: boolean
    tokens?: Record<string, Token>
    rewarder?: {
        tokens: Record<string, RewarderToken>
    }
    staking?: {
        tokens: Record<string, boolean>
    }
    treasurer?: {
        tokens: Record<string, boolean>
    }
}

export function loadChainConfig(filePath: string): Chain {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const chain = yaml.load(fileContents) as Chain
        return chain
    } catch (e) {
        console.error('Error loading YAML file:', e)
        throw e
    }
}

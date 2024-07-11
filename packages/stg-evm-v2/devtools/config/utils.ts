import assert from 'assert'

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

import { formatEid } from '@layerzerolabs/devtools'
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
        },
    },
    receiveConfig: {
        ulnConfig: {
            requiredDVNs: fromConfig.requiredDVNs ?? [],
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
        },
    },
    receiveConfig: {
        ulnConfig: {
            requiredDVNs: fromConfig.requiredDVNs ?? [],
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

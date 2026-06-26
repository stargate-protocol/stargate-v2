import fs from 'fs'
import path from 'path'

import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'
import {
    CreditMessagingEdgeConfig,
    CreditMessagingNodeConfig,
    TokenMessagingEdgeConfig,
    TokenMessagingNodeConfig,
} from '@stargatefinance/stg-devtools-v2'
import * as yaml from 'js-yaml'

import { makeZeroAddress } from '@layerzerolabs/devtools-evm'
import {
    OmniEdgeHardhat,
    OmniGraphHardhat,
    OmniPointHardhat,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'
import { getDeployedContractAddress } from '@layerzerolabs/lz-evm-sdk-v2'
import { createLogger } from '@layerzerolabs/lz-utilities'

import { type Chain, getContractWithEid, getOneSigAddressMaybe } from '../utils'

import { getAssetsConfig } from './shared'
import {
    filterFromAndToChains,
    getChainsThatSupportMessaging,
    getChainsThatSupportToken,
    getSupportedTokensByEid,
    getTokenName,
    printChains,
    requireStage,
    setStage,
} from './utils.config'

type MessagingNode = TokenMessagingNodeConfig | CreditMessagingNodeConfig
type MessagingEdge = TokenMessagingEdgeConfig | CreditMessagingEdgeConfig
type MessagingContractName = 'TokenMessaging' | 'CreditMessaging'

/** Controls which direction(s) of edges are disabled for a given unwire rule.
 *  - `both`: disable chain→peers AND peers→chain
 *  - `from`: disable only chain→peers (the named chain stops sending to peers)
 *  - `to`: disable only peers→chain (peers stop sending to the named chain)
 */
type UnwireDirection = 'from' | 'to' | 'both'

type ResolvedMessagingUnwireConfig = {
    chain: Chain
    peerChains: Chain[]
    allChains: Chain[]
    allowedPeers: string[]
    direction: UnwireDirection
}

function logMessagingUnwireChains(allChains: Chain[], allowedPeers: string[]): void {
    const keepNames = new Set(allowedPeers)
    const chainsToKeep = allChains.filter((chain) => keepNames.has(chain.name))
    const chainsToUnwire = allChains.filter((chain) => !keepNames.has(chain.name))
    printChains('Messaging unwire CHAINS (to keep):', chainsToKeep)
    printChains('Messaging unwire CHAINS (to unwire):', chainsToUnwire)
}

export const MESSAGING_UNWIRE_CHAIN_ENV = 'UNWIRE_CHAIN'

const DEFAULT_ASSET_CONFIG_RELATIVE_PATH = path.join('asset.unwire.yml')
const VALID_DIRECTIONS: UnwireDirection[] = ['from', 'to', 'both']
const isUnwireDirection = (direction: unknown): direction is UnwireDirection =>
    typeof direction === 'string' && VALID_DIRECTIONS.includes(direction as UnwireDirection)

const chainsToUnwireConfigDir: Record<Stage, string> = {
    [Stage.MAINNET]: path.join(__dirname, '..', 'mainnet', '01', 'chainsConfig', 'unwire'),
    [Stage.TESTNET]: path.join(__dirname, '..', 'testnet', 'chainsConfig', 'unwire'),
    [Stage.SANDBOX]: path.join(__dirname, '..', 'sandbox', 'chainsConfig', 'unwire'),
}

export type AssetUnwireYamlConfig = {
    asset: string
    disconnect_chains: string[] | string
    remaining_chains?: string[] | string
}

export type ResolvedAssetUnwireConfig = {
    tokenName: TokenName
    disconnectChains: string[]
    remainingChains: string[]
    configPath: string
}

const uniqueChains = (chains: Chain[]): Chain[] =>
    chains.filter((chain, index) => chains.findIndex((candidate) => candidate.name === chain.name) === index)

const getMessagingUnwireConfigKey = (contractName: MessagingContractName): 'token_messaging' | 'credit_messaging' => {
    switch (contractName) {
        case 'TokenMessaging':
            return 'token_messaging'
        case 'CreditMessaging':
            return 'credit_messaging'
    }
    const exhaustive: never = contractName
    throw new Error(`Unsupported messaging unwire contract: ${exhaustive}`)
}

// Load the messaging unwire rule from the target chain config.
export function loadMessagingUnwireConfig(contractName: MessagingContractName): ResolvedMessagingUnwireConfig {
    const unwireChainName = process.env[MESSAGING_UNWIRE_CHAIN_ENV]?.trim()
    if (!unwireChainName) {
        throw new Error(`${MESSAGING_UNWIRE_CHAIN_ENV} is required. Pass --unwire-chain <chain-name>.`)
    }

    const peerChains = getChainsThatSupportMessaging()
    const resolvableChains = getChainsThatSupportMessaging({ includeDeprecated: true })
    const chain = resolvableChains.find((chain) => chain.name === unwireChainName)
    if (!chain) {
        throw new Error(`Invalid messaging unwire chain: ${unwireChainName}`)
    }

    const unwireKey = getMessagingUnwireConfigKey(contractName)
    const unwireConfig = chain.unwire?.[unwireKey]
    if (!unwireConfig) {
        throw new Error(`Missing unwire.${unwireKey} config for ${chain.name}`)
    }

    const configLabel = `unwire.${unwireKey} for ${chain.name}`
    const allowedPeers = normalizeChainList(
        unwireConfig.allowed_peers,
        'allowed_peers',
        configLabel,
        'Messaging unwire'
    )
    if (!isUnwireDirection(unwireConfig.direction)) {
        throw new Error(
            `Invalid direction "${String(unwireConfig.direction)}" in ${configLabel}. Must be one of: ${VALID_DIRECTIONS.join(', ')}`
        )
    }

    const allChains = uniqueChains([...peerChains, chain])
    logMessagingUnwireChains(allChains, allowedPeers)

    return { chain, peerChains, allChains, allowedPeers, direction: unwireConfig.direction }
}

// Load asset unwire config (disconnect/remaining chains) for the current stage (requires stage to be set).
export function loadAssetUnwireConfig(): ResolvedAssetUnwireConfig | undefined {
    const logger = createLogger(process.env.LOG_LEVEL || 'info')
    const stage = requireStage()
    const configPath = path.join(chainsToUnwireConfigDir[stage], DEFAULT_ASSET_CONFIG_RELATIVE_PATH)
    if (!fs.existsSync(configPath)) {
        logger.warn(`No asset unwire config file at ${configPath}, chains list empty`)
        return undefined
    }

    const fileContents = fs.readFileSync(configPath, 'utf8')
    const rawConfig = yaml.load(fileContents) as Partial<AssetUnwireYamlConfig> | undefined

    if (!rawConfig || typeof rawConfig !== 'object') {
        throw new Error(`Invalid unwire config at ${configPath}`)
    }

    if (!rawConfig.asset || typeof rawConfig.asset !== 'string') {
        throw new Error(`Unwire config missing 'asset' string at ${configPath}`)
    }

    const tokenName = getTokenName(rawConfig.asset.toLowerCase())
    const disconnectChains = normalizeChainList(rawConfig.disconnect_chains, 'disconnect_chains', configPath, 'Unwire')
    const remainingChainsInput = normalizeOptionalChainList(rawConfig.remaining_chains)
    const remainingChains = resolveAssetRemainingChains(tokenName, disconnectChains, remainingChainsInput, configPath)

    if (remainingChainsInput.length === 0) {
        logger.info(
            `remaining_chains is empty at ${configPath}; using all ${remainingChains.length} other ${tokenName} chains`
        )
    }

    const disconnectChainsLower = disconnectChains.map((chain) => chain.toLowerCase())
    const remainingChainsLower = remainingChains.map((chain) => chain.toLowerCase())

    // Enforce no duplicates within each list.
    if (new Set(disconnectChainsLower).size !== disconnectChains.length) {
        throw new Error('disconnect_chains contains duplicate entries')
    }
    if (new Set(remainingChainsLower).size !== remainingChains.length) {
        throw new Error('remaining_chains contains duplicate entries')
    }

    // Ensure disconnect and remaining lists do not overlap.
    const overlap = disconnectChainsLower.filter((chain) => remainingChainsLower.includes(chain))
    if (overlap.length > 0) {
        throw new Error(`disconnect_chains and remaining_chains must be disjoint, but share: ${overlap.join(', ')}`)
    }

    return {
        tokenName,
        disconnectChains,
        remainingChains,
        configPath,
    }
}

// Filter and log valid chain pairs for unwire operations.
export function resolveAssetUnwireChains(tokenName: TokenName, disconnectChains: string[], remainingChains: string[]) {
    const supportedChains = getChainsThatSupportToken(tokenName, { includeDeprecated: true })
    const { validFromChains, validToChains } = filterFromAndToChains(disconnectChains, remainingChains, supportedChains)

    printChains(`Asset unwire DISCONNECT_CHAINS:`, validFromChains)
    printChains(`Asset unwire REMAINING_CHAINS:`, validToChains)

    return { validFromChains, validToChains }
}

// Build an omni graph for asset messaging unwire (zero-asset config). Sets stage then loads config from current stage.
export async function buildAssetMessagingUnwireGraph(
    stage: Stage,
    contractName: 'TokenMessaging' | 'CreditMessaging',
    defaultPlanner: string
): Promise<OmniGraphHardhat<MessagingNode, MessagingEdge>> {
    setStage(stage)

    const assetUnwireConfig = loadAssetUnwireConfig()
    if (!assetUnwireConfig) {
        return { contracts: [], connections: [] }
    }

    const { validFromChains } = resolveAssetUnwireChains(
        assetUnwireConfig.tokenName,
        assetUnwireConfig.disconnectChains,
        assetUnwireConfig.remainingChains
    )

    const assetId = ASSETS[assetUnwireConfig.tokenName].assetId
    const zeroAddress = makeZeroAddress()

    const contracts = validFromChains.map((chain) => ({
        contract: getContractWithEid(chain.eid, { contractName }),
        config: {
            planner: defaultPlanner,
            assets: {
                [zeroAddress]: assetId,
            },
        },
    }))

    return {
        contracts,
        connections: [],
    }
}

// Build an omni graph that disables messaging edges per unwire rules. Sets stage then loads config from current stage.
export async function buildMessagingUnwireGraph(
    stage: Stage,
    contract: { contractName: MessagingContractName },
    defaultPlanner: string,
    generateMessagingConfig: (points: OmniPointHardhat[]) => OmniEdgeHardhat<MessagingEdge>[]
): Promise<OmniGraphHardhat<MessagingNode, MessagingEdge>> {
    setStage(stage)

    const unwireConfig = loadMessagingUnwireConfig(contract.contractName)
    const deadDvnByEid = loadDeadDvnByEid(unwireConfig.allChains)

    const disabledEdges = new Map<string, UnwireDirection>()
    const involvedChains = new Map<string, Chain>()
    const allowedPeers = new Set(unwireConfig.allowedPeers)

    unwireConfig.peerChains.forEach((peer) => {
        if (peer.name === unwireConfig.chain.name || allowedPeers.has(peer.name)) {
            return
        }

        involvedChains.set(unwireConfig.chain.name, unwireConfig.chain)
        involvedChains.set(peer.name, peer)

        // 'from': chain → peer only (named chain stops sending to peers)
        // 'to':   peer → chain only (peers stop sending to named chain)
        // 'both': both directions
        if (unwireConfig.direction !== 'to') {
            disabledEdges.set(`${unwireConfig.chain.eid}:${peer.eid}`, unwireConfig.direction)
        }
        if (unwireConfig.direction !== 'from') {
            disabledEdges.set(`${peer.eid}:${unwireConfig.chain.eid}`, unwireConfig.direction)
        }
    })

    const contracts = Array.from(involvedChains.values()).map((chain) => {
        return getContractWithEid(chain.eid, contract)
    })

    const allConnections = generateMessagingConfig(contracts)
    const connections = allConnections
        .map((edge) => {
            const direction = disabledEdges.get(`${edge.from.eid}:${edge.to.eid}`)
            return direction ? disableMessagingEdge(edge, deadDvnByEid, direction) : undefined
        })
        .filter((edge): edge is OmniEdgeHardhat<MessagingEdge> => edge !== undefined)

    const getEnvironment = createGetHreByEid()
    const contractConfigs = await Promise.all(
        contracts.map(async (contract) => {
            const onesig = getOneSigAddressMaybe(contract.eid)
            return {
                contract,
                config: {
                    ...(onesig !== undefined ? { owner: onesig } : {}),
                    ...(onesig !== undefined ? { delegate: onesig } : {}),
                    planner: defaultPlanner,
                    assets: await getAssetsConfig(getEnvironment, contract.eid, getSupportedTokensByEid(contract.eid)),
                },
            }
        })
    )

    return {
        contracts: contractConfigs,
        connections,
    }
}

// When remaining_chains is empty or omitted, use every other chain that supports the asset.
const resolveAssetRemainingChains = (
    tokenName: TokenName,
    disconnectChains: string[],
    remainingChainsInput: string[],
    configPath: string
): string[] => {
    if (remainingChainsInput.length > 0) {
        return remainingChainsInput
    }

    const disconnectSet = new Set(disconnectChains.map((chain) => chain.toLowerCase()))
    const remainingChains = getChainsThatSupportToken(tokenName)
        .map((chain) => chain.name)
        .filter((name) => !disconnectSet.has(name.toLowerCase()))

    if (remainingChains.length === 0) {
        throw new Error(
            `No remaining chains for asset "${tokenName}" after excluding disconnect_chains at ${configPath}`
        )
    }

    return remainingChains
}

// Normalize a string or list of strings into a clean chain list. Empty or omitted values return [].
const normalizeOptionalChainList = (value: string[] | string | undefined): string[] => {
    if (value == null) {
        return []
    }

    const list = Array.isArray(value) ? value : [value]
    return list.map((entry) => entry.trim()).filter(Boolean)
}

// Normalize a string or list of strings into a clean chain list.
const normalizeChainList = (
    value: string[] | string | undefined,
    field: string,
    configPath: string,
    configLabel: string
): string[] => {
    if (value == null) {
        throw new Error(`${configLabel} config missing '${field}' at ${configPath}`)
    }

    const list = Array.isArray(value) ? value : [value]
    const normalized = list.map((entry) => entry.trim()).filter(Boolean)

    if (!normalized.length) {
        throw new Error(`${configLabel} config '${field}' must include at least one chain at ${configPath}`)
    }

    return normalized
}

const loadDeadDvnByEid = (chains: Array<{ name: string; eid: number }>): Map<number, string> => {
    const deadDvnByEid = new Map<number, string>()
    chains.forEach((chain) => {
        deadDvnByEid.set(chain.eid, getDeployedContractAddress(chain.name, 'DeadDVN'))
    })
    return deadDvnByEid
}

const disableMessagingEdge = (
    edge: OmniEdgeHardhat<MessagingEdge>,
    deadDvnByEid: Map<number, string>,
    direction: UnwireDirection
): OmniEdgeHardhat<MessagingEdge> => {
    const zeroAddress = makeZeroAddress()
    const fromDeadDvn = deadDvnByEid.get(edge.from.eid)
    if (!fromDeadDvn) {
        throw new Error(`Missing DeadDVN for local chain ${edge.from.eid} while disabling edge to ${edge.to.eid}`)
    }

    const sendUlnConfig = {
        ...edge.config.sendConfig?.ulnConfig,
        requiredDVNs: [fromDeadDvn],
        optionalDVNs: [],
        optionalDVNThreshold: 0,
    }

    if (direction !== 'both') {
        return {
            ...edge,
            config: {
                sendConfig: {
                    ...edge.config.sendConfig,
                    ulnConfig: sendUlnConfig,
                },
            },
        }
    }

    const config: MessagingEdge = {
        ...edge.config,
        sendConfig: {
            ...edge.config.sendConfig,
            executorConfig: {
                maxMessageSize: edge.config.sendConfig?.executorConfig?.maxMessageSize ?? 0,
                executor: zeroAddress,
            },
            ulnConfig: sendUlnConfig,
        },
        receiveConfig: {
            ulnConfig: {
                requiredDVNs: [fromDeadDvn],
                optionalDVNs: [],
                optionalDVNThreshold: 0,
                confirmations: 0n,
            },
        },
    }

    return {
        ...edge,
        config,
    }
}

import fs from 'fs'
import path from 'path'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
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

import { getContractWithEid, getOneSigAddressMaybe } from '../utils'

import { getAssetsConfig } from './shared'
import {
    filterFromAndToChains,
    getChainsThatSupportMessaging,
    getChainsThatSupportToken,
    getSupportedTokensByEid,
    getTokenName,
    printChains,
    setStage,
} from './utils.config'

type MessagingNode = TokenMessagingNodeConfig | CreditMessagingNodeConfig
type MessagingEdge = TokenMessagingEdgeConfig | CreditMessagingEdgeConfig

type MessagingUnwireRule = {
    chain: string
    allowed_peers: string[] | string
}

type MessagingUnwireYamlConfig = {
    rules: MessagingUnwireRule[]
}

type ResolvedMessagingUnwireConfig = {
    rules: Array<{ chain: string; allowedPeers: string[] }>
    configPath: string
}

const DEFAULT_MESSAGING_CONFIG_RELATIVE_PATH = path.join('messaging.unwire.yml')
const DEFAULT_ASSET_CONFIG_RELATIVE_PATH = path.join('asset.unwire.yml')

const chainsToUnwireConfigDir: Record<Stage, string> = {
    [Stage.MAINNET]: path.join(__dirname, '..', 'mainnet', '01', 'chainsConfig', 'unwire'),
    [Stage.TESTNET]: path.join(__dirname, '..', 'testnet', 'chainsConfig', 'unwire'),
    [Stage.SANDBOX]: path.join(__dirname, '..', 'sandbox', 'chainsConfig', 'unwire'),
}

export type AssetUnwireYamlConfig = {
    asset: string
    disconnect_chains: string[] | string
    remaining_chains: string[] | string
}

export type ResolvedAssetUnwireConfig = {
    tokenName: TokenName
    disconnectChains: string[]
    remainingChains: string[]
    configPath: string
}

// Load the messaging unwire rules for a specific config directory.
export function loadMessagingUnwireConfig(stage: Stage): ResolvedMessagingUnwireConfig | undefined {
    const configPath = path.join(chainsToUnwireConfigDir[stage], DEFAULT_MESSAGING_CONFIG_RELATIVE_PATH)
    if (!fs.existsSync(configPath)) {
        return undefined
    }

    const fileContents = fs.readFileSync(configPath, 'utf8')
    const rawConfig = yaml.load(fileContents) as Partial<MessagingUnwireYamlConfig> | undefined

    if (!rawConfig || typeof rawConfig !== 'object' || !Array.isArray(rawConfig.rules)) {
        throw new Error(`Invalid messaging unwire config at ${configPath}`)
    }

    if (!rawConfig.rules.length) {
        return undefined
    }

    const rules = rawConfig.rules.map((rule, index) => {
        if (!rule.chain || typeof rule.chain !== 'string') {
            throw new Error(`Messaging unwire rule missing 'chain' at ${configPath} (index ${index})`)
        }
        const allowedPeers = normalizeChainList(rule.allowed_peers, 'allowed_peers', configPath, 'Messaging unwire')
        return { chain: rule.chain, allowedPeers }
    })

    return { rules, configPath }
}

// Load asset unwire config (disconnect/remaining chains) from the provided directory.
export function loadAssetUnwireConfig(stage: Stage): ResolvedAssetUnwireConfig | undefined {
    const configPath = path.join(chainsToUnwireConfigDir[stage], DEFAULT_ASSET_CONFIG_RELATIVE_PATH)
    console.log('configPath', configPath)
    if (!fs.existsSync(configPath)) {
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
    const remainingChains = normalizeChainList(rawConfig.remaining_chains, 'remaining_chains', configPath, 'Unwire')

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
    const supportedChains = getChainsThatSupportToken(tokenName)
    const { validFromChains, validToChains } = filterFromAndToChains(disconnectChains, remainingChains, supportedChains)

    printChains(`unwire DISCONNECT_CHAINS:`, validFromChains)
    printChains(`unwire REMAINING_CHAINS:`, validToChains)

    return { validFromChains, validToChains }
}

// Build an omni graph that disables messaging edges per unwire rules.
export async function buildMessagingUnwireGraph(
    stage: Stage,
    contract: { contractName: string },
    defaultPlanner: string,
    generateMessagingConfig: (points: OmniPointHardhat[]) => OmniEdgeHardhat<MessagingEdge>[],
    unwireConfig: ResolvedMessagingUnwireConfig
): Promise<OmniGraphHardhat<MessagingNode, MessagingEdge>> {
    setStage(stage)

    const supportedChains = getChainsThatSupportMessaging()
    const chainByName = new Map(supportedChains.map((chain) => [chain.name, chain]))

    const disallowedEdges = new Set<string>()
    const involvedChainNames = new Set<string>()

    unwireConfig.rules.forEach((rule) => {
        const chain = chainByName.get(rule.chain)
        if (!chain) {
            throw new Error(`Invalid messaging unwire chain: ${rule.chain}`)
        }

        const allowedPeers = new Set(rule.allowedPeers)
        supportedChains.forEach((peer) => {
            if (peer.name === chain.name || allowedPeers.has(peer.name)) {
                return
            }
            disallowedEdges.add(`${chain.eid}:${peer.eid}`)
            disallowedEdges.add(`${peer.eid}:${chain.eid}`)
            involvedChainNames.add(chain.name)
            involvedChainNames.add(peer.name)
        })
    })

    const contracts = Array.from(involvedChainNames).map((name) => {
        const chain = chainByName.get(name)
        if (!chain) {
            throw new Error(`Missing messaging chain config for ${name}`)
        }
        return getContractWithEid(chain.eid, contract)
    })

    const allConnections = generateMessagingConfig(contracts)
    const connections = allConnections
        .filter((edge) => disallowedEdges.has(`${edge.from.eid}:${edge.to.eid}`))
        .map((edge) => disableMessagingEdge(edge))

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

// Disable a messaging edge by zeroing executor/DVN settings.
const disableMessagingEdge = (edge: OmniEdgeHardhat<MessagingEdge>): OmniEdgeHardhat<MessagingEdge> => {
    const zeroAddress = makeZeroAddress()
    const maxMessageSize = edge.config.sendConfig?.executorConfig?.maxMessageSize ?? 0

    return {
        ...edge,
        config: {
            ...edge.config,
            sendConfig: {
                ...edge.config.sendConfig,
                executorConfig: {
                    maxMessageSize,
                    executor: zeroAddress,
                },
                ulnConfig: {
                    ...edge.config.sendConfig?.ulnConfig,
                    requiredDVNs: [zeroAddress],
                    optionalDVNs: [zeroAddress],
                    optionalDVNThreshold: 0,
                },
            },
            receiveConfig: {
                ...edge.config.receiveConfig,
                ulnConfig: {
                    ...edge.config.receiveConfig?.ulnConfig,
                    requiredDVNs: [zeroAddress],
                    optionalDVNs: [zeroAddress],
                    optionalDVNThreshold: 0,
                },
            },
        },
    }
}

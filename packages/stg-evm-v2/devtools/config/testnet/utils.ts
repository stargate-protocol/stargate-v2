import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { CreditMessagingEdgeConfig, TokenMessagingEdgeConfig } from '@stargatefinance/stg-devtools-v2'
import hre from 'hardhat'

import { withEid } from '@layerzerolabs/devtools'
import { OmniEdgeHardhat, OmniPointHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId, Stage } from '@layerzerolabs/lz-definitions'

import { getNamedAccount } from '../../../ts-src/utils/util'
import { getContractsInChain, setsDifference } from '../utils'
import buildAssetDeploymentGraph from '../utils/asset.config.utils'
import buildFeeLibV1DeploymentGraph from '../utils/feelib-v1.config.utils'
import buildMessagingGraph from '../utils/messaging.config.utils'
import { setStage } from '../utils/utils.config'

import { DEFAULT_PLANNER } from './constants'

export const onEth = withEid(EndpointId.SEPOLIA_V2_TESTNET)
export const onBsc = withEid(EndpointId.BSC_V2_TESTNET)
export const onArb = withEid(EndpointId.ARBSEP_V2_TESTNET)
export const onAvalanche = withEid(EndpointId.AVALANCHE_V2_TESTNET)
export const onOpt = withEid(EndpointId.OPTSEP_V2_TESTNET)
export const onKlaytn = withEid(EndpointId.KLAYTN_V2_TESTNET)
export const onOdyssey = withEid(EndpointId.ODYSSEY_V2_TESTNET)
export const onMantle = withEid(EndpointId.MANTLESEP_V2_TESTNET)
export const onMonad = withEid(EndpointId.MONAD_V2_TESTNET)

export const chainEids = {
    'avalanche-testnet': EndpointId.AVALANCHE_V2_TESTNET,
    'arbsep-testnet': EndpointId.ARBSEP_V2_TESTNET,
    'bsc-testnet': EndpointId.BSC_V2_TESTNET,
    'klaytn-testnet': EndpointId.KLAYTN_V2_TESTNET,
    'mantle-testnet': EndpointId.MANTLESEP_V2_TESTNET,
    'monad-testnet': EndpointId.MONAD_V2_TESTNET,
    'odyssey-testnet': EndpointId.ODYSSEY_V2_TESTNET,
    'opt-testnet': EndpointId.OPTSEP_V2_TESTNET,
    'sepolia-testnet': EndpointId.SEPOLIA_V2_TESTNET,
}

export const allSupportedChains = new Set(Object.keys(chainEids))

const excludedCreditMessagingChains = new Set([
    // Add chains that should be excluded from credit messaging
])
const excludedTokenMessagingChains = new Set([
    // Add chains that should be excluded from token messaging
])

export const validCreditMessagingChains = setsDifference(allSupportedChains, excludedCreditMessagingChains)
export const validTokenMessagingChains = setsDifference(allSupportedChains, excludedTokenMessagingChains)

export function isValidCreditMessagingChain(chain: string): boolean {
    return validCreditMessagingChains.has(chain)
}

export function isValidTokenMessagingChain(chain: string): boolean {
    return validTokenMessagingChains.has(chain)
}

export function isValidChain(chain: string): boolean {
    return allSupportedChains.has(chain)
}

export function getContracts(chains: string[] | null, contract: any, isValidChain: (chain: string) => boolean) {
    return getContractsInChain(chains, contract, isValidChain, chainEids)
}

export function setTestnetStage() {
    setStage(Stage.TESTNET)
}

export async function buildAssetDeploymentGraphTestnet(tokenName: TokenName) {
    const deployer = await hre.getNamedAccounts().then(getNamedAccount(`deployer`))
    return buildAssetDeploymentGraph(Stage.TESTNET, tokenName, deployer)
}

export function buildMessagingGraphTestnet(
    contract: { contractName: string },
    messagingType: string,
    generateMessagingConfig: (
        points: OmniPointHardhat[]
    ) => OmniEdgeHardhat<TokenMessagingEdgeConfig | CreditMessagingEdgeConfig>[]
) {
    return buildMessagingGraph(Stage.TESTNET, contract, messagingType, DEFAULT_PLANNER, generateMessagingConfig)
}

export function buildFeeLibV1DeploymentGraphTestnet(tokenName: TokenName) {
    return buildFeeLibV1DeploymentGraph(Stage.TESTNET, tokenName, DEFAULT_PLANNER)
}

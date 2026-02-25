import { TokenName } from '@stargatefinance/stg-definitions-v2'
import {
    CreditMessagingEdgeConfig,
    CreditMessagingNodeConfig,
    FeeLibV1EdgeConfig,
    FeeLibV1NodeConfig,
    TokenMessagingEdgeConfig,
    TokenMessagingNodeConfig,
} from '@stargatefinance/stg-devtools-v2'

import { OmniEdgeHardhat, OmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import buildAssetDeploymentGraph from '../utils/asset.config.utils'
import buildCircleFiatTokenGraph from '../utils/circle-fiat-token.config.utils'
import buildFeeLibV1DeploymentGraph from '../utils/feelib-v1.config.utils'
import buildMessagingGraph from '../utils/messaging.config.utils'
import buildRewarderGraph from '../utils/rewarder.config.utils'
import buildStakingGraph from '../utils/staking.config.utils'
import buildTIP20TokenGraph from '../utils/tip20-token.config.utils'
import buildTreasurerGraph from '../utils/treasurer.config.utils'
import { buildAssetMessagingUnwireGraph, buildMessagingUnwireGraph } from '../utils/unwire.config.utils'
import buildUsdtTokenGraph from '../utils/usdt-token.config.utils'
import { setStage } from '../utils/utils.config'

import { DEFAULT_PLANNER } from './01/constants'

export function setMainnetStage() {
    setStage(Stage.MAINNET)
}

export function buildAssetDeploymentGraphMainnet(tokenName: TokenName) {
    return buildAssetDeploymentGraph(Stage.MAINNET, tokenName, DEFAULT_PLANNER)
}

export function buildMessagingGraphMainnet(
    contract: { contractName: string },
    messagingType: string,
    generateMessagingConfig: (
        points: OmniPointHardhat[]
    ) => OmniEdgeHardhat<TokenMessagingEdgeConfig | CreditMessagingEdgeConfig>[]
) {
    return buildMessagingGraph(Stage.MAINNET, contract, messagingType, DEFAULT_PLANNER, generateMessagingConfig)
}

type MessagingNode = TokenMessagingNodeConfig | CreditMessagingNodeConfig
type MessagingEdge = TokenMessagingEdgeConfig | CreditMessagingEdgeConfig

export function buildAssetMessagingUnwireGraphMainnet(contractName: 'TokenMessaging' | 'CreditMessaging') {
    return buildAssetMessagingUnwireGraph(Stage.MAINNET, contractName, DEFAULT_PLANNER)
}

export async function buildMessagingUnwireGraphMainnet(
    contract: { contractName: 'TokenMessaging' | 'CreditMessaging' },
    generateMessagingConfig: (points: OmniPointHardhat[]) => OmniEdgeHardhat<MessagingEdge>[]
): Promise<OmniGraphHardhat<MessagingNode, MessagingEdge>> {
    return buildMessagingUnwireGraph(Stage.MAINNET, contract, DEFAULT_PLANNER, generateMessagingConfig) as Promise<
        OmniGraphHardhat<MessagingNode, MessagingEdge>
    >
}

export function buildFeeLibV1DeploymentGraphMainnet(
    tokenName: TokenName
): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> {
    return buildFeeLibV1DeploymentGraph(Stage.MAINNET, tokenName, DEFAULT_PLANNER)
}

export function buildRewarderGraphMainnet(contract: { contractName: string }) {
    return buildRewarderGraph(Stage.MAINNET, contract)
}

export function buildStakingGraphMainnet(rewarder: { contractName: string }, staking: { contractName: string }) {
    return buildStakingGraph(Stage.MAINNET, rewarder, staking)
}

export function buildTreasurerGraphMainnet(contract: { contractName: string }) {
    return buildTreasurerGraph(Stage.MAINNET, contract)
}

export function buildUsdtTokenGraphMainnet() {
    return buildUsdtTokenGraph(Stage.MAINNET)
}

export function buildCircleFiatTokenGraphMainnet(tokenName: TokenName) {
    return buildCircleFiatTokenGraph(Stage.MAINNET, tokenName)
}

export function buildTIP20TokenGraphMainnet(tokenName: TokenName) {
    return buildTIP20TokenGraph(Stage.MAINNET, tokenName)
}

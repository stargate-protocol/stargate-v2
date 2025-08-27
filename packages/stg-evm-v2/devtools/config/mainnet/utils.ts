import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { CreditMessagingEdgeConfig, TokenMessagingEdgeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniEdgeHardhat, OmniPointHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import buildAssetDeploymentGraph from '../utils/asset.config.utils'
import buildCircleFiatTokenGraph from '../utils/circle-fiat-token.config.utils'
import buildFeeLibV1DeploymentGraph from '../utils/feelib-v1.config.utils'
import buildMessagingGraph from '../utils/messaging.config.utils'
import buildRewarderGraph from '../utils/rewarder.config.utils'
import buildStakingGraph from '../utils/staking.config.utils'
import buildTreasurerGraph from '../utils/treasurer.config.utils'
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

export function buildFeeLibV1DeploymentGraphMainnet(tokenName: TokenName) {
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

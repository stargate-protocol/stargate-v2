import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { CreditMessagingEdgeConfig, TokenMessagingEdgeConfig } from '@stargatefinance/stg-devtools-v2'
import hre from 'hardhat'

import { OmniEdgeHardhat, OmniPointHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import { getNamedAccount } from '../../../ts-src/utils/util'
import buildAssetDeploymentGraph from '../utils/asset.config.utils'
import buildFeeLibV1DeploymentGraph from '../utils/feelib-v1.config.utils'
import buildMessagingGraph from '../utils/messaging.config.utils'
import buildRewarderGraph from '../utils/rewarder.config.utils'
import buildStakingGraph from '../utils/staking.config.utils'
import buildTreasurerGraph from '../utils/treasurer.config.utils'
import buildUsdcTokenGraph from '../utils/usdc-token.config.utils'
import buildUsdtTokenGraph from '../utils/usdt-token.config.utils'
import { setStage } from '../utils/utils.config'

import { DEFAULT_PLANNER } from './constants'

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

export function buildRewarderGraphTestnet(contract: { contractName: string }) {
    return buildRewarderGraph(Stage.TESTNET, contract)
}

export function buildStakingGraphTestnet(rewarder: { contractName: string }, staking: { contractName: string }) {
    return buildStakingGraph(Stage.TESTNET, rewarder, staking)
}

export function buildTreasurerGraphTestnet(contract: { contractName: string }) {
    return buildTreasurerGraph(Stage.TESTNET, contract)
}

export function buildUsdcTokenGraphTestnet() {
    return buildUsdcTokenGraph(Stage.TESTNET)
}

export function buildUsdtTokenGraphTestnet() {
    return buildUsdtTokenGraph(Stage.TESTNET)
}

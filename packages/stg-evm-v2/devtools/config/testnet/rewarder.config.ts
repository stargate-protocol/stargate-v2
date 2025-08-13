import { RewarderNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import buildRewarderGraph from '../utils/rewarder.config.utils'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderNodeConfig, unknown>> => {
    return buildRewarderGraph(Stage.TESTNET, contract)
}

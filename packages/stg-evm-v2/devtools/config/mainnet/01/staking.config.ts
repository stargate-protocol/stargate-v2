import { StakingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import buildStakingGraph from '../../utils/staking.config.utils'

const rewarder = { contractName: 'StargateMultiRewarder' }
const staking = { contractName: 'StargateStaking' }

export default async (): Promise<OmniGraphHardhat<StakingNodeConfig, never>> => {
    return buildStakingGraph(Stage.MAINNET, rewarder, staking)
}

import { StakingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildStakingGraphTestnet } from './utils'

const rewarder = { contractName: 'StargateMultiRewarder' }
const staking = { contractName: 'StargateStaking' }

export default async (): Promise<OmniGraphHardhat<StakingNodeConfig, never>> => {
    return buildStakingGraphTestnet(rewarder, staking)
}

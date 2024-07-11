import { RewardTokenName } from '@stargatefinance/stg-definitions-v2'
import { RewarderRewardsNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetRewardTokenAddresses } from '../../../ts-src/utils/util'

import { onBsc, onEth, onPolygon } from './utils'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderRewardsNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const rewardTokens = [RewardTokenName.MOCK_A] as const
    const getRewardTokenAddresses = createGetRewardTokenAddresses(getEnvironment)
    const ethRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ETHEREUM_V2_SANDBOX, rewardTokens)
    const bscRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.BSC_V2_SANDBOX, rewardTokens)
    const polygonRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.POLYGON_V2_SANDBOX, rewardTokens)

    // 1e18 reward per second
    const DEFAULT_REWARDS_CONFIG = {
        amount: BigInt(2419200000000000000000000000n),
        start: Math.round(Date.now() / 1000) + 100, // add 100 so start is in the future
        duration: 2419200000, // 28 days in seconds
    }

    return {
        contracts: [
            {
                contract: onEth(contract),
                config: {
                    rewards: {
                        rewardToken: ethRewardTokenAddresses.MOCK_A,
                        ...DEFAULT_REWARDS_CONFIG,
                    },
                },
            },
            {
                contract: onBsc(contract),
                config: {
                    rewards: {
                        rewardToken: bscRewardTokenAddresses.MOCK_A,
                        ...DEFAULT_REWARDS_CONFIG,
                    },
                },
            },
            {
                contract: onPolygon(contract),
                config: {
                    rewards: {
                        rewardToken: polygonRewardTokenAddresses.MOCK_A,
                        ...DEFAULT_REWARDS_CONFIG,
                    },
                },
            },
        ],
        connections: [],
    }
}

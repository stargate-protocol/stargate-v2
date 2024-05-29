import { RewardTokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetRewardTokenAddresses } from '../../../ts-src/utils/util'
import { RewarderNodeConfig } from '../../src/rewarder'

import { onBsc, onEth, onPolygon } from './utils'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderNodeConfig, unknown>> => {
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
        start: Date.now() + 100, // add 100 so start is in the future
        duration: 2419200000, // 28 days in seconds
    }

    return {
        contracts: [
            {
                contract: onEth(contract),
                config: {
                    allocations: {
                        [ethRewardTokenAddresses.MOCK_A]: {},
                    },
                },
            },
            {
                contract: onBsc(contract),
                config: {
                    allocations: {
                        [bscRewardTokenAddresses.MOCK_A]: {},
                    },
                },
            },
            {
                contract: onPolygon(contract),
                config: {
                    allocations: {
                        [polygonRewardTokenAddresses.MOCK_A]: {},
                    },
                },
            },
        ],
        connections: [],
    }
}

import { RewardTokenName } from '@stargatefinance/stg-definitions-v2'
import { RewarderRewardsNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { createGetRewardTokenAddresses } from '../../../ts-src/utils/util'
import { getContractWithEid } from '../utils'
import { getChainsThatSupportRewarder } from '../utils/utils.config'

import { setTestnetStage } from './utils'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderRewardsNodeConfig, unknown>> => {
    // Set the stage to testnet
    setTestnetStage()

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const rewardTokens = [RewardTokenName.MOCK_A] as const
    const getRewardTokenAddresses = createGetRewardTokenAddresses(getEnvironment)

    // 1e18 reward per second
    const DEFAULT_REWARDS_CONFIG = {
        amount: BigInt(2419200000000000000000000000n),
        start: Math.round(Date.now() / 1000) + 100, // add 100 so start is in the future
        duration: 2419200000, // 28 days in seconds
    }

    // get chains that support rewards
    // get valid chains config in the chainsList
    const validChains = getChainsThatSupportRewarder()

    const contracts = await Promise.all(
        validChains.map(async (chain) => {
            return {
                contract: getContractWithEid(chain.eid, contract),
                config: {
                    rewards: {
                        rewardToken: (await getRewardTokenAddresses(chain.eid, rewardTokens))[rewardTokens[0]],
                        ...DEFAULT_REWARDS_CONFIG,
                    },
                },
            }
        })
    )

    return {
        contracts,
        connections: [],
    }
}

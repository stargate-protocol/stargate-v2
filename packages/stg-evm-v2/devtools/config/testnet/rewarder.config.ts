import { RewardTokenName, TokenName } from '@stargatefinance/stg-definitions-v2'
import { RewarderNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { onArb, onBsc, onEth, onMantle, onOpt } from './utils'
import { createGetLPTokenAddresses, createGetRewardTokenAddresses } from '../../../ts-src/utils/util'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const rewardTokens = [RewardTokenName.MOCK_A] as const
    const getRewardTokenAddresses = createGetRewardTokenAddresses(getEnvironment)
    const ethRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.SEPOLIA_V2_TESTNET, rewardTokens)
    const bscRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.BSC_V2_TESTNET, rewardTokens)
    const optRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.OPTSEP_V2_TESTNET, rewardTokens)
    const arbRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ARBSEP_V2_TESTNET, rewardTokens)
    const mantleRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.MANTLESEP_V2_TESTNET, rewardTokens)
    const absRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ABSTRACT_V2_TESTNET, rewardTokens)

    const allAssets = [TokenName.USDT, TokenName.USDC, TokenName.ETH] as const
    const getLPTokenAddresses = createGetLPTokenAddresses(getEnvironment)
    const ethLPTokenAddresses = await getLPTokenAddresses(EndpointId.SEPOLIA_V2_TESTNET, allAssets)
    const bscLPTokenAddresses = await getLPTokenAddresses(EndpointId.BSC_V2_TESTNET, [TokenName.USDT] as const)
    const optLPTokenAddresses = await getLPTokenAddresses(EndpointId.OPTSEP_V2_TESTNET, allAssets)
    const arbLPTokenAddresses = await getLPTokenAddresses(EndpointId.ARBSEP_V2_TESTNET, allAssets)
    const mantleLPTokenAddresses = await getLPTokenAddresses(EndpointId.MANTLESEP_V2_TESTNET, allAssets)
    const absLPTokenAddresses = await getLPTokenAddresses(EndpointId.ABSTRACT_V2_TESTNET, allAssets)

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
                        [ethRewardTokenAddresses.MOCK_A]: {
                            [ethLPTokenAddresses.USDT]: 1,
                            [ethLPTokenAddresses.USDC]: 1,
                            [ethLPTokenAddresses.ETH]: 1,
                        },
                    },
                },
            },
            {
                contract: onBsc(contract),
                config: {
                    allocations: {
                        [bscRewardTokenAddresses.MOCK_A]: {
                            [bscLPTokenAddresses.USDT]: 1,
                        },
                    },
                },
            },
            {
                contract: onOpt(contract),
                config: {
                    allocations: {
                        [optRewardTokenAddresses.MOCK_A]: {
                            [optLPTokenAddresses.USDT]: 1,
                            [optLPTokenAddresses.USDC]: 1,
                            [optLPTokenAddresses.ETH]: 1,
                        },
                    },
                },
            },
            {
                contract: onArb(contract),
                config: {
                    allocations: {
                        [arbRewardTokenAddresses.MOCK_A]: {
                            [arbLPTokenAddresses.USDT]: 1,
                            [arbLPTokenAddresses.USDC]: 1,
                            [arbLPTokenAddresses.ETH]: 1,
                        },
                    },
                },
            },
            {
                contract: onMantle(contract),
                config: {
                    allocations: {
                        [mantleRewardTokenAddresses.MOCK_A]: {
                            [mantleLPTokenAddresses.USDT]: 1,
                            [mantleLPTokenAddresses.USDC]: 1,
                            [mantleLPTokenAddresses.ETH]: 1,
                        },
                    },
                },
            },
            {
                contract: onAbs(contract),
                config: {
                    allocations: {
                        [absRewardTokenAddresses.MOCK_A]: {
                            [absLPTokenAddresses.USDT]: 1,
                            [absLPTokenAddresses.USDC]: 1,
                            [absLPTokenAddresses.ETH]: 1,
                        },
                    },
                },
            },
        ],
        connections: [],
    }
}

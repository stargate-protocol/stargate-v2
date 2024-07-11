import { RewardTokenName } from '@stargatefinance/stg-definitions-v2'
import { RewarderNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetRewardTokenAddresses } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
import {
    onArb,
    onAurora,
    onAvax,
    onBase,
    onBsc,
    onEth,
    onKava,
    onMantle,
    onMetis,
    onOpt,
    onPolygon,
    onScroll,
    onZkConsensys,
} from '../utils'

import { getLPTokenAddresses } from './shared'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // Step 1: Retrieve all the reward token addresses on the given chains
    const getRewardTokenAddresses = createGetRewardTokenAddresses(getEnvironment)
    const arbRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ARBITRUM_V2_MAINNET, [
        RewardTokenName.ARB,
        RewardTokenName.STG,
    ] as const)
    const auroraRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.AURORA_V2_MAINNET, [
        RewardTokenName.AURORA,
    ] as const)
    const avaRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.AVALANCHE_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)
    const baseRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.BASE_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)
    const bscRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.BSC_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)
    const ethRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ETHEREUM_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)
    const kavaRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.KAVA_V2_MAINNET, [
        RewardTokenName.wKAVA,
    ] as const)
    const mantleRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.MANTLE_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)
    const metisRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.METIS_V2_MAINNET, [
        RewardTokenName.METIS,
    ] as const)
    const optRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.OPTIMISM_V2_MAINNET, [
        RewardTokenName.OP,
        RewardTokenName.STG,
    ] as const)
    const polygonRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.POLYGON_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)
    const scrollRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.SCROLL_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)
    const zkConsensysRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ZKCONSENSYS_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)

    // Step 2: Retrieve all the LP token addresses on the given chains
    const lpTokenAddresses = await getLPTokenAddresses(getEnvironment)

    return {
        contracts: [
            {
                contract: onArb(contract),
                config: {
                    owner: getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET),
                    allocations: {
                        [arbRewardTokenAddresses.ARB]: {
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].ETH]: 3129,
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDC]: 4294,
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDT]: 2577,
                        },
                        [arbRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].ETH]: 3129,
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDC]: 4294,
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDT]: 2577,
                        },
                    },
                },
            },
            {
                contract: onAurora(contract),
                config: {
                    owner: getSafeAddress(EndpointId.AURORA_V2_MAINNET),
                    allocations: {
                        [auroraRewardTokenAddresses.AURORA]: {
                            [lpTokenAddresses[EndpointId.AURORA_V2_MAINNET].USDC]: 10000,
                        },
                    },
                },
            },
            {
                contract: onAvax(contract),
                config: {
                    owner: getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET),
                    allocations: {
                        [avaRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.AVALANCHE_V2_MAINNET].USDC]: 6429,
                            [lpTokenAddresses[EndpointId.AVALANCHE_V2_MAINNET].USDT]: 3571,
                        },
                    },
                },
            },
            {
                contract: onBase(contract),
                config: {
                    owner: getSafeAddress(EndpointId.BASE_V2_MAINNET),
                    allocations: {
                        [baseRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.BASE_V2_MAINNET].ETH]: 4615,
                            [lpTokenAddresses[EndpointId.BASE_V2_MAINNET].USDC]: 5385,
                        },
                    },
                },
            },
            {
                contract: onBsc(contract),
                config: {
                    owner: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                    allocations: {
                        [bscRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.BSC_V2_MAINNET].USDT]: 10000,
                        },
                    },
                },
            },
            {
                contract: onEth(contract),
                config: {
                    owner: getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET),
                    allocations: {
                        [ethRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].ETH]: 3226,
                            [lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].USDC]: 3763,
                            [lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].USDT]: 3011,
                        },
                    },
                },
            },
            {
                contract: onKava(contract),
                config: {
                    owner: getSafeAddress(EndpointId.KAVA_V2_MAINNET),
                    allocations: {
                        [kavaRewardTokenAddresses.wKAVA]: {
                            [lpTokenAddresses[EndpointId.KAVA_V2_MAINNET].USDT]: 10000,
                        },
                    },
                },
            },
            {
                contract: onMantle(contract),
                config: {
                    owner: getSafeAddress(EndpointId.MANTLE_V2_MAINNET),
                    allocations: {
                        [mantleRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].ETH]: 3000,
                            [lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].USDC]: 3500,
                            [lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].USDT]: 3500,
                        },
                    },
                },
            },
            {
                contract: onMetis(contract),
                config: {
                    owner: getSafeAddress(EndpointId.METIS_V2_MAINNET),
                    allocations: {
                        [metisRewardTokenAddresses.METIS]: {
                            [lpTokenAddresses[EndpointId.METIS_V2_MAINNET].ETH]: 5625,
                            [lpTokenAddresses[EndpointId.METIS_V2_MAINNET].USDT]: 4375,
                        },
                    },
                },
            },
            {
                contract: onOpt(contract),
                config: {
                    owner: getSafeAddress(EndpointId.OPTIMISM_V2_MAINNET),
                    allocations: {
                        [optRewardTokenAddresses.OP]: {
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].ETH]: 3974,
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDC]: 3863,
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDT]: 2163,
                        },
                        [optRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].ETH]: 3974,
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDC]: 3863,
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDT]: 2163,
                        },
                    },
                },
            },
            {
                contract: onPolygon(contract),
                config: {
                    owner: getSafeAddress(EndpointId.POLYGON_V2_MAINNET),
                    allocations: {
                        [polygonRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.POLYGON_V2_MAINNET].USDC]: 4167,
                            [lpTokenAddresses[EndpointId.POLYGON_V2_MAINNET].USDT]: 5833,
                        },
                    },
                },
            },
            {
                contract: onScroll(contract),
                config: {
                    owner: getSafeAddress(EndpointId.SCROLL_V2_MAINNET),
                    allocations: {
                        [scrollRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.SCROLL_V2_MAINNET].ETH]: 5000,
                            [lpTokenAddresses[EndpointId.SCROLL_V2_MAINNET].USDC]: 5000,
                        },
                    },
                },
            },
            {
                contract: onZkConsensys(contract),
                config: {
                    owner: getSafeAddress(EndpointId.ZKCONSENSYS_V2_MAINNET),
                    allocations: {
                        [zkConsensysRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.ZKCONSENSYS_V2_MAINNET].ETH]: 10000,
                        },
                    },
                },
            },
        ],
        connections: [],
    }
}

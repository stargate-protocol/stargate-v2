import { RewardTokenName } from '@stargatefinance/stg-definitions-v2'
import { RewarderNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetRewardTokenAddresses } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
import {
    onAbstract,
    onArb,
    onAurora,
    onAvax,
    onBase,
    onBsc,
    onCoredao,
    onEth,
    onHemi,
    onKava,
    onLightlink,
    onManta,
    onMantle,
    onMetis,
    onOpt,
    onPolygon,
    onScroll,
    onSei,
    onSoneium,
    onSonic,
    onZkConsensys,
} from '../utils'

import { getLPTokenAddresses } from './shared'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // Step 1: Retrieve all the reward token addresses on the given chains
    const getRewardTokenAddresses = createGetRewardTokenAddresses(getEnvironment)
    const abstractRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ABSTRACT_V2_MAINNET, [
        RewardTokenName.ETH,
    ] as const)
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
    const coredaoRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.COREDAO_V2_MAINNET, [
        RewardTokenName.CORE,
    ] as const)
    const ethRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ETHEREUM_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)
    const hemiRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.HEMI_V2_MAINNET, [
        RewardTokenName.WETH,
    ] as const)
    const kavaRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.KAVA_V2_MAINNET, [
        RewardTokenName.wKAVA,
    ] as const)
    const lightlinkRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.LIGHTLINK_V2_MAINNET, [
        RewardTokenName.LLE,
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
    const seiRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.SEI_V2_MAINNET, [
        RewardTokenName.SEI,
    ] as const)
    const soneiumRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.SONEIUM_V2_MAINNET, [
        RewardTokenName.WETH,
    ] as const)
    const sonicRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.SONIC_V2_MAINNET, [
        RewardTokenName.S,
    ] as const)
    const zkConsensysRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.ZKCONSENSYS_V2_MAINNET, [
        RewardTokenName.STG,
    ] as const)

    const mantaRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.MANTA_V2_MAINNET, [
        RewardTokenName.MANTA,
    ] as const)

    // Step 2: Retrieve all the LP token addresses on the given chains
    const lpTokenAddresses = await getLPTokenAddresses(getEnvironment)

    return {
        contracts: [
            {
                contract: onAbstract(contract),
                config: {
                    owner: getSafeAddress(EndpointId.ABSTRACT_V2_MAINNET),
                    allocations: {
                        [abstractRewardTokenAddresses.ETH]: {
                            [lpTokenAddresses[EndpointId.ABSTRACT_V2_MAINNET].ETH]: 10000,
                        },
                    },
                },
            },
            {
                contract: onArb(contract),
                config: {
                    owner: getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET),
                    allocations: {
                        [arbRewardTokenAddresses.ARB]: {
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].ETH]: 6000,
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDC]: 2500,
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDT]: 1500,
                        },
                        [arbRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].ETH]: 1,
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDC]: 1,
                            [lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDT]: 9998,
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
                            [lpTokenAddresses[EndpointId.AVALANCHE_V2_MAINNET].USDC]: 5000,
                            [lpTokenAddresses[EndpointId.AVALANCHE_V2_MAINNET].USDT]: 5000,
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
                            [lpTokenAddresses[EndpointId.BASE_V2_MAINNET].ETH]: 6500,
                            [lpTokenAddresses[EndpointId.BASE_V2_MAINNET].USDC]: 3500,
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
                            [lpTokenAddresses[EndpointId.BSC_V2_MAINNET].USDC]: 1000,
                            [lpTokenAddresses[EndpointId.BSC_V2_MAINNET].USDT]: 9000,
                        },
                    },
                },
            },
            {
                contract: onCoredao(contract),
                config: {
                    owner: getSafeAddress(EndpointId.COREDAO_V2_MAINNET),
                    allocations: {
                        [coredaoRewardTokenAddresses.CORE]: {
                            [lpTokenAddresses[EndpointId.COREDAO_V2_MAINNET].USDC]: 5000,
                            [lpTokenAddresses[EndpointId.COREDAO_V2_MAINNET].USDT]: 5000,
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
                            [lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].ETH]: 1,
                            [lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].USDC]: 1,
                            [lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].USDT]: 9998,
                        },
                    },
                },
            },
            {
                contract: onHemi(contract),
                config: {
                    owner: getSafeAddress(EndpointId.HEMI_V2_MAINNET),
                    allocations: {
                        [hemiRewardTokenAddresses.WETH]: {
                            [lpTokenAddresses[EndpointId.HEMI_V2_MAINNET].ETH]: 10000,
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
                contract: onLightlink(contract),
                config: {
                    owner: getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET),
                    allocations: {
                        [lightlinkRewardTokenAddresses.LLE]: {
                            [lpTokenAddresses[EndpointId.LIGHTLINK_V2_MAINNET].ETH]: 10000,
                        },
                    },
                },
            },
            {
                contract: onManta(contract),
                config: {
                    owner: getSafeAddress(EndpointId.MANTA_V2_MAINNET),
                    allocations: {
                        [mantaRewardTokenAddresses.MANTA]: {
                            [lpTokenAddresses[EndpointId.MANTA_V2_MAINNET].ETH]: 10000,
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
                            [lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].ETH]: 7000,
                            [lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].USDC]: 1500,
                            [lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].USDT]: 1500,
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
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].ETH]: 6000,
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDC]: 1500,
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDT]: 2500,
                        },
                        [optRewardTokenAddresses.STG]: {
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].ETH]: 6000,
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDC]: 1500,
                            [lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDT]: 2500,
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
                            [lpTokenAddresses[EndpointId.POLYGON_V2_MAINNET].USDC]: 5959,
                            [lpTokenAddresses[EndpointId.POLYGON_V2_MAINNET].USDT]: 4041,
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
                            [lpTokenAddresses[EndpointId.SCROLL_V2_MAINNET].ETH]: 7000,
                            [lpTokenAddresses[EndpointId.SCROLL_V2_MAINNET].USDC]: 3000,
                        },
                    },
                },
            },
            {
                contract: onSei(contract),
                config: {
                    owner: getSafeAddress(EndpointId.SEI_V2_MAINNET),
                    allocations: {
                        [seiRewardTokenAddresses.SEI]: {
                            [lpTokenAddresses[EndpointId.SEI_V2_MAINNET].USDC]: 5000,
                            [lpTokenAddresses[EndpointId.SEI_V2_MAINNET].USDT]: 5000,
                        },
                    },
                },
            },
            {
                contract: onSoneium(contract),
                config: {
                    owner: getSafeAddress(EndpointId.SONEIUM_V2_MAINNET),
                    allocations: {
                        [soneiumRewardTokenAddresses.WETH]: {
                            [lpTokenAddresses[EndpointId.SONEIUM_V2_MAINNET].ETH]: 10000,
                        },
                    },
                },
            },
            {
                contract: onSonic(contract),
                config: {
                    owner: getSafeAddress(EndpointId.SONIC_V2_MAINNET),
                    allocations: {
                        [sonicRewardTokenAddresses.S]: {
                            [lpTokenAddresses[EndpointId.SONIC_V2_MAINNET].USDC]: 10000,
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

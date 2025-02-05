import { StakingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import {
    OmniGraphHardhat,
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

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
    onMantle,
    onMetis,
    onOpt,
    onPolygon,
    onScroll,
    onSei,
    onSoneium,
    onZkConsensys,
} from '../utils'

import { getLPTokenAddresses } from './shared'

const rewarder = { contractName: 'StargateMultiRewarder' }
const staking = { contractName: 'StargateStaking' }

export default async (): Promise<OmniGraphHardhat<StakingNodeConfig, never>> => {
    const getEnvironment = createGetHreByEid()
    const contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment))

    // Get the rewarder contract
    const abstractRewarder = await contractFactory(onAbstract(rewarder))
    const arbRewarder = await contractFactory(onArb(rewarder))
    const auroraRewarder = await contractFactory(onAurora(rewarder))
    const avaxRewarder = await contractFactory(onAvax(rewarder))
    const baseRewarder = await contractFactory(onBase(rewarder))
    const bscRewarder = await contractFactory(onBsc(rewarder))
    const coredaoRewarder = await contractFactory(onCoredao(rewarder))
    const ethRewarder = await contractFactory(onEth(rewarder))
    const hemiRewarder = await contractFactory(onHemi(rewarder))
    const kavaRewarder = await contractFactory(onKava(rewarder))
    const lightlinkRewarder = await contractFactory(onLightlink(rewarder))
    const mantleRewarder = await contractFactory(onMantle(rewarder))
    const metisRewarder = await contractFactory(onMetis(rewarder))
    const optRewarder = await contractFactory(onOpt(rewarder))
    const polygonRewarder = await contractFactory(onPolygon(rewarder))
    const scrollRewarder = await contractFactory(onScroll(rewarder))
    const seiRewarder = await contractFactory(onSei(rewarder))
    const soneiumRewarder = await contractFactory(onSoneium(rewarder))
    const zkConsensysRewarder = await contractFactory(onZkConsensys(rewarder))

    // Get the staking contract
    const abstractStaking = onAbstract(staking)
    const arbStaking = onArb(staking)
    const auroraStaking = onAurora(staking)
    const avaxStaking = onAvax(staking)
    const baseStaking = onBase(staking)
    const bscStaking = onBsc(staking)
    const coredaoStaking = onCoredao(staking)
    const ethStaking = onEth(staking)
    const hemiStaking = onHemi(staking)
    const kavaStaking = onKava(staking)
    const lightlinkStaking = onLightlink(staking)
    const mantleStaking = onMantle(staking)
    const metisStaking = onMetis(staking)
    const optStaking = onOpt(staking)
    const polygonStaking = onPolygon(staking)
    const scrollStaking = onScroll(staking)
    const seiStaking = onSei(staking)
    const soneiumStaking = onSoneium(staking)
    const zkConsensysStaking = onZkConsensys(staking)

    // Template objects for pool configuration
    //
    // These will need to be populated with a token address and passed to pools configuration
    const abstractPool = { rewarder: abstractRewarder.contract.address }
    const arbPool = { rewarder: arbRewarder.contract.address }
    const auroraPool = { rewarder: auroraRewarder.contract.address }
    const avaxPool = { rewarder: avaxRewarder.contract.address }
    const basePool = { rewarder: baseRewarder.contract.address }
    const bscPool = { rewarder: bscRewarder.contract.address }
    const coredaoPool = { rewarder: coredaoRewarder.contract.address }
    const ethPool = { rewarder: ethRewarder.contract.address }
    const hemiPool = { rewarder: hemiRewarder.contract.address }
    const kavaPool = { rewarder: kavaRewarder.contract.address }
    const lightlinkPool = { rewarder: lightlinkRewarder.contract.address }
    const mantlePool = { rewarder: mantleRewarder.contract.address }
    const metisPool = { rewarder: metisRewarder.contract.address }
    const optPool = { rewarder: optRewarder.contract.address }
    const polygonPool = { rewarder: polygonRewarder.contract.address }
    const scrollPool = { rewarder: scrollRewarder.contract.address }
    const seiPool = { rewarder: seiRewarder.contract.address }
    const soneiumPool = { rewarder: soneiumRewarder.contract.address }
    const zkConsensysPool = { rewarder: zkConsensysRewarder.contract.address }

    // get the LPToken addresses
    const lpTokenAddresses = await getLPTokenAddresses(getEnvironment)

    return {
        contracts: [
            {
                contract: abstractStaking,
                config: {
                    owner: getSafeAddress(EndpointId.ABSTRACT_V2_MAINNET),
                    pools: [
                        {
                            ...abstractPool,
                            token: lpTokenAddresses[EndpointId.ABSTRACT_V2_MAINNET].ETH,
                        },
                    ],
                },
            },
            {
                contract: arbStaking,
                config: {
                    owner: getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET),
                    pools: [
                        {
                            ...arbPool,
                            token: lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDC,
                        },
                        {
                            ...arbPool,
                            token: lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].USDT,
                        },
                        {
                            ...arbPool,
                            token: lpTokenAddresses[EndpointId.ARBITRUM_V2_MAINNET].ETH,
                        },
                    ],
                },
            },
            {
                contract: auroraStaking,
                config: {
                    owner: getSafeAddress(EndpointId.AURORA_V2_MAINNET),
                    pools: [
                        {
                            ...auroraPool,
                            token: lpTokenAddresses[EndpointId.AURORA_V2_MAINNET].USDC,
                        },
                    ],
                },
            },
            {
                contract: avaxStaking,
                config: {
                    owner: getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET),
                    pools: [
                        {
                            ...avaxPool,
                            token: lpTokenAddresses[EndpointId.AVALANCHE_V2_MAINNET].USDC,
                        },
                        {
                            ...avaxPool,
                            token: lpTokenAddresses[EndpointId.AVALANCHE_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: baseStaking,
                config: {
                    owner: getSafeAddress(EndpointId.BASE_V2_MAINNET),
                    pools: [
                        {
                            ...basePool,
                            token: lpTokenAddresses[EndpointId.BASE_V2_MAINNET].ETH,
                        },
                        {
                            ...basePool,
                            token: lpTokenAddresses[EndpointId.BASE_V2_MAINNET].USDC,
                        },
                    ],
                },
            },
            {
                contract: bscStaking,
                config: {
                    owner: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                    pools: [
                        {
                            ...bscPool,
                            token: lpTokenAddresses[EndpointId.BSC_V2_MAINNET].USDC,
                        },
                        {
                            ...bscPool,
                            token: lpTokenAddresses[EndpointId.BSC_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: coredaoStaking,
                config: {
                    owner: getSafeAddress(EndpointId.COREDAO_V2_MAINNET),
                    pools: [
                        {
                            ...coredaoPool,
                            token: lpTokenAddresses[EndpointId.COREDAO_V2_MAINNET].USDC,
                        },
                        {
                            ...coredaoPool,
                            token: lpTokenAddresses[EndpointId.COREDAO_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: ethStaking,
                config: {
                    owner: getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET),
                    pools: [
                        {
                            ...ethPool,
                            token: lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].ETH,
                        },
                        {
                            ...ethPool,
                            token: lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].USDC,
                        },
                        {
                            ...ethPool,
                            token: lpTokenAddresses[EndpointId.ETHEREUM_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: hemiStaking,
                config: {
                    owner: getSafeAddress(EndpointId.HEMI_V2_MAINNET),
                    pools: [
                        {
                            ...hemiPool,
                            token: lpTokenAddresses[EndpointId.HEMI_V2_MAINNET].ETH,
                        },
                    ],
                },
            },
            {
                contract: kavaStaking,
                config: {
                    owner: getSafeAddress(EndpointId.KAVA_V2_MAINNET),
                    pools: [
                        {
                            ...kavaPool,
                            token: lpTokenAddresses[EndpointId.KAVA_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: lightlinkStaking,
                config: {
                    owner: getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET),
                    pools: [
                        {
                            ...lightlinkPool,
                            token: lpTokenAddresses[EndpointId.LIGHTLINK_V2_MAINNET].ETH,
                        },
                    ],
                },
            },
            {
                contract: mantleStaking,
                config: {
                    owner: getSafeAddress(EndpointId.MANTLE_V2_MAINNET),
                    pools: [
                        {
                            ...mantlePool,
                            token: lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].USDC,
                        },
                        {
                            ...mantlePool,
                            token: lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].ETH,
                        },
                        {
                            ...mantlePool,
                            token: lpTokenAddresses[EndpointId.MANTLE_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: metisStaking,
                config: {
                    owner: getSafeAddress(EndpointId.METIS_V2_MAINNET),
                    pools: [
                        {
                            ...metisPool,
                            token: lpTokenAddresses[EndpointId.METIS_V2_MAINNET].ETH,
                        },
                        {
                            ...metisPool,
                            token: lpTokenAddresses[EndpointId.METIS_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: optStaking,
                config: {
                    owner: getSafeAddress(EndpointId.OPTIMISM_V2_MAINNET),
                    pools: [
                        {
                            ...optPool,
                            token: lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].ETH,
                        },
                        {
                            ...optPool,
                            token: lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDC,
                        },
                        {
                            ...optPool,
                            token: lpTokenAddresses[EndpointId.OPTIMISM_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: polygonStaking,
                config: {
                    owner: getSafeAddress(EndpointId.POLYGON_V2_MAINNET),
                    pools: [
                        {
                            ...polygonPool,
                            token: lpTokenAddresses[EndpointId.POLYGON_V2_MAINNET].USDC,
                        },
                        {
                            ...polygonPool,
                            token: lpTokenAddresses[EndpointId.POLYGON_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: scrollStaking,
                config: {
                    owner: getSafeAddress(EndpointId.SCROLL_V2_MAINNET),
                    pools: [
                        {
                            ...scrollPool,
                            token: lpTokenAddresses[EndpointId.SCROLL_V2_MAINNET].ETH,
                        },
                        {
                            ...scrollPool,
                            token: lpTokenAddresses[EndpointId.SCROLL_V2_MAINNET].USDC,
                        },
                    ],
                },
            },
            {
                contract: seiStaking,
                config: {
                    owner: getSafeAddress(EndpointId.SEI_V2_MAINNET),
                    pools: [
                        {
                            ...seiPool,
                            token: lpTokenAddresses[EndpointId.SEI_V2_MAINNET].USDC,
                        },
                        {
                            ...seiPool,
                            token: lpTokenAddresses[EndpointId.SEI_V2_MAINNET].USDT,
                        },
                    ],
                },
            },
            {
                contract: soneiumStaking,
                config: {
                    owner: getSafeAddress(EndpointId.SONEIUM_V2_MAINNET),
                    pools: [
                        {
                            ...soneiumPool,
                            token: lpTokenAddresses[EndpointId.SONEIUM_V2_MAINNET].ETH,
                        },
                        {
                            ...soneiumPool,
                            token: lpTokenAddresses[EndpointId.SONEIUM_V2_MAINNET].USDC,
                        },
                    ],
                },
            },
            {
                contract: zkConsensysStaking,
                config: {
                    owner: getSafeAddress(EndpointId.ZKCONSENSYS_V2_MAINNET),
                    pools: [
                        {
                            ...zkConsensysPool,
                            token: lpTokenAddresses[EndpointId.ZKCONSENSYS_V2_MAINNET].ETH,
                        },
                    ],
                },
            },
        ],
        connections: [],
    }
}

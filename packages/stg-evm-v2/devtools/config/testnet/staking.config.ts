import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { StakingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import {
    OmniGraphHardhat,
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetLPTokenAddresses } from '../../../ts-src/utils/util'

import { onArb, onAvalanche, onBsc, onEth, onMantle, onMonad, onOpt } from './utils'

const staking = { contractName: 'StargateStaking' }
const rewarder = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<StakingNodeConfig, never>> => {
    const getEnvironment = createGetHreByEid()
    const contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment))

    const ethStaking = onEth(staking)
    const bscStaking = onBsc(staking)
    const optStaking = onOpt(staking)
    const arbStaking = onArb(staking)
    const avalancheStaking = onAvalanche(staking)
    const mantleStaking = onMantle(staking)
    const monadStaking = onMonad(staking)

    // Get the rewarder contract
    const ethRewarder = await contractFactory(onEth(rewarder))
    const bscRewarder = await contractFactory(onBsc(rewarder))
    const optRewarder = await contractFactory(onOpt(rewarder))
    const arbRewarder = await contractFactory(onArb(rewarder))
    const avalancheRewarder = await contractFactory(onAvalanche(rewarder))
    const mantleRewarder = await contractFactory(onMantle(rewarder))
    const monadRewarder = await contractFactory(onMonad(rewarder))

    // Template objects for pool configuration
    //
    // These will need to be populated with a token address and passed to pools configuration
    const ethPool = { rewarder: ethRewarder.contract.address }
    const bscPool = { rewarder: bscRewarder.contract.address }
    const optPool = { rewarder: optRewarder.contract.address }
    const arbPool = { rewarder: arbRewarder.contract.address }
    const avalanchePool = { rewarder: avalancheRewarder.contract.address }
    const mantlePool = { rewarder: mantleRewarder.contract.address }
    const monadPool = { rewarder: monadRewarder.contract.address }

    const getLPTokenAddresses = createGetLPTokenAddresses(getEnvironment)

    const allAssets = [TokenName.USDT, TokenName.USDC, TokenName.ETH] as const
    const ethLPTokenAddresses = await getLPTokenAddresses(EndpointId.SEPOLIA_V2_TESTNET, allAssets)
    const bscLPTokenAddresses = await getLPTokenAddresses(EndpointId.BSC_V2_TESTNET, [TokenName.USDT] as const)
    const optLPTokenAddresses = await getLPTokenAddresses(EndpointId.OPTSEP_V2_TESTNET, allAssets)
    const arbLPTokenAddresses = await getLPTokenAddresses(EndpointId.ARBSEP_V2_TESTNET, allAssets)
    const avalancheLPTokenAddresses = await getLPTokenAddresses(EndpointId.AVALANCHE_V2_TESTNET, [
        TokenName.USDT,
    ] as const)
    const mantleLPTokenAddresses = await getLPTokenAddresses(EndpointId.MANTLESEP_V2_TESTNET, allAssets)
    const monadLPTokenAddresses = await getLPTokenAddresses(EndpointId.MONAD_V2_TESTNET, allAssets)

    return {
        contracts: [
            {
                contract: ethStaking,
                config: {
                    pools: [
                        {
                            ...ethPool,
                            token: ethLPTokenAddresses.USDT,
                        },
                        {
                            ...ethPool,
                            token: ethLPTokenAddresses.USDC,
                        },
                        {
                            ...ethPool,
                            token: ethLPTokenAddresses.ETH,
                        },
                    ],
                },
            },
            {
                contract: bscStaking,
                config: {
                    pools: [
                        {
                            ...bscPool,
                            token: bscLPTokenAddresses.USDT,
                        },
                    ],
                },
            },
            {
                contract: optStaking,
                config: {
                    pools: [
                        {
                            ...optPool,
                            token: optLPTokenAddresses.USDT,
                        },
                        {
                            ...optPool,
                            token: optLPTokenAddresses.USDC,
                        },
                        {
                            ...optPool,
                            token: optLPTokenAddresses.ETH,
                        },
                    ],
                },
            },
            {
                contract: arbStaking,
                config: {
                    pools: [
                        {
                            ...arbPool,
                            token: arbLPTokenAddresses.USDT,
                        },
                        {
                            ...arbPool,
                            token: arbLPTokenAddresses.USDC,
                        },
                        {
                            ...arbPool,
                            token: arbLPTokenAddresses.ETH,
                        },
                    ],
                },
            },
            {
                contract: avalancheStaking,
                config: {
                    pools: [
                        {
                            ...avalanchePool,
                            token: avalancheLPTokenAddresses.USDT,
                        },
                    ],
                },
            },
            {
                contract: mantleStaking,
                config: {
                    pools: [
                        {
                            ...mantlePool,
                            token: mantleLPTokenAddresses.USDT,
                        },
                        {
                            ...mantlePool,
                            token: mantleLPTokenAddresses.USDC,
                        },
                        {
                            ...mantlePool,
                            token: mantleLPTokenAddresses.ETH,
                        },
                    ],
                },
            },
            {
                contract: monadStaking,
                config: {
                    pools: [
                        {
                            ...monadPool,
                            token: monadLPTokenAddresses.USDT,
                        },
                        {
                            ...monadPool,
                            token: monadLPTokenAddresses.USDC,
                        },
                        {
                            ...monadPool,
                            token: monadLPTokenAddresses.ETH,
                        },
                    ],
                },
            },
        ],
        connections: [],
    }
}

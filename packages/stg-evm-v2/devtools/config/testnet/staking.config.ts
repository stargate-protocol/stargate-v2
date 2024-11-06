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

import { onAbs, onArb, onBsc, onEth, onOpt } from './utils'

const staking = { contractName: 'StargateStaking' }
const rewarder = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<StakingNodeConfig, never>> => {
    const getEnvironment = createGetHreByEid()
    const contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment))

    const ethStaking = onEth(staking)
    const bscStaking = onBsc(staking)
    const optStaking = onOpt(staking)
    const arbStaking = onArb(staking)
    const absStaking = onAbs(staking)

    // Get the rewarder contract
    const ethRewarder = await contractFactory(onEth(rewarder))
    const bscRewarder = await contractFactory(onBsc(rewarder))
    const optRewarder = await contractFactory(onOpt(rewarder))
    const arbRewarder = await contractFactory(onArb(rewarder))
    const absRewarder = await contractFactory(onAbs(rewarder))

    // Template objects for pool configuration
    //
    // These will need to be populated with a token address and passed to pools configuration
    const ethPool = { rewarder: ethRewarder.contract.address }
    const bscPool = { rewarder: bscRewarder.contract.address }
    const optPool = { rewarder: optRewarder.contract.address }
    const arbPool = { rewarder: arbRewarder.contract.address }
    const absPool = { rewarder: absRewarder.contract.address }

    const getLPTokenAddresses = createGetLPTokenAddresses(getEnvironment)

    const allAssets = [TokenName.USDT, TokenName.USDC, TokenName.ETH] as const
    const ethLPTokenAddresses = await getLPTokenAddresses(EndpointId.SEPOLIA_V2_TESTNET, allAssets)
    const bscLPTokenAddresses = await getLPTokenAddresses(EndpointId.BSC_V2_TESTNET, [TokenName.USDT] as const)
    const optLPTokenAddresses = await getLPTokenAddresses(EndpointId.OPTSEP_V2_TESTNET, allAssets)
    const arbLPTokenAddresses = await getLPTokenAddresses(EndpointId.ARBSEP_V2_TESTNET, allAssets)
    const absLPTokenAddresses = await getLPTokenAddresses(EndpointId.ABSTRACT_V2_TESTNET, [TokenName.ETH] as const)

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
                contract: absStaking,
                config: {
                    pools: [
                        {
                            ...absPool,
                            token: absLPTokenAddresses.ETH,
                        },
                    ],
                },
            },
        ],
        connections: [],
    }
}

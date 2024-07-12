import { ASSETS, REWARDS, RewardTokenName, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ERC20NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDTDeployName } from '../../../ops/util'
import { getNamedAccount } from '../../../ts-src/utils/util'

import { onArb, onBsc, onEth, onOpt } from './utils'

const contract = { contractName: REWARDS[RewardTokenName.MOCK_A].name }
const rewarder = { contractName: 'StargateMultiRewarder' }
const getDeployer = getNamedAccount('deployer')

export default async (): Promise<OmniGraphHardhat<ERC20NodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const bsc = await getEnvironment(EndpointId.BSC_V2_TESTNET)
    const eth = await getEnvironment(EndpointId.SEPOLIA_V2_TESTNET)
    const arb = await getEnvironment(EndpointId.ARBSEP_V2_TESTNET)
    const opt = await getEnvironment(EndpointId.OPTSEP_V2_TESTNET)

    // Then grab the deployer account for each network to be used as the admin
    const bscAdmin = await bsc.getNamedAccounts().then(getDeployer)
    const ethAdmin = await eth.getNamedAccounts().then(getDeployer)
    const arbAdmin = await arb.getNamedAccounts().then(getDeployer)
    const optAdmin = await opt.getNamedAccounts().then(getDeployer)

    // Rewarder contracts to give allowance to
    const bscRewarder = await contractFactory(onBsc(rewarder))
    const ethRewarder = await contractFactory(onEth(rewarder))
    const arbRewarder = await contractFactory(onArb(rewarder))
    const optRewarder = await contractFactory(onOpt(rewarder))

    // USDC
    const ethUsdc = onEth({
        contractName: 'FiatTokenV2_2',
        address: ASSETS[TokenName.USDC].networks[EndpointId.SEPOLIA_V2_TESTNET]?.address,
    })
    const optUsdc = onOpt({
        contractName: 'FiatTokenV2_2',
        address: ASSETS[TokenName.USDC].networks[EndpointId.OPTSEP_V2_TESTNET]?.address,
    })
    const arbUsdc = onArb({
        contractName: 'FiatTokenV2_2',
        address: ASSETS[TokenName.USDC].networks[EndpointId.ARBSEP_V2_TESTNET]?.address,
    })

    // USDT
    const ethUsdt = await contractFactory(onEth({ contractName: getUSDTDeployName() }))
    const bscUsdt = onBsc({
        contractName: 'FiatTokenV2_2',
        address: ASSETS[TokenName.USDT].networks[EndpointId.BSC_V2_TESTNET]?.address,
    })
    const optUsdt = await contractFactory(onOpt({ contractName: getUSDTDeployName() }))
    const arbUsdt = await contractFactory(onArb({ contractName: getUSDTDeployName() }))

    // collect eth pools
    const ethUsdcPool = await contractFactory(onEth({ contractName: 'StargatePoolUSDC' }))
    const ethUsdtPool = await contractFactory(onEth({ contractName: 'StargatePoolUSDT' }))

    // collect opt pools
    const optUsdcPool = await contractFactory(onOpt({ contractName: 'StargatePoolUSDC' }))
    const optUsdtPool = await contractFactory(onOpt({ contractName: 'StargatePoolUSDT' }))

    // collect arb pools
    const arbUsdcPool = await contractFactory(onArb({ contractName: 'StargatePoolUSDC' }))
    const arbUsdtPool = await contractFactory(onArb({ contractName: 'StargatePoolUSDT' }))

    // collect bsc pools
    const bscUsdtPool = await contractFactory(onBsc({ contractName: 'StargatePoolUSDT' }))

    const ethUsdtContract = { address: ethUsdt.contract.address }
    const optUsdtContract = { address: optUsdt.contract.address }
    const arbUsdtContract = { address: arbUsdt.contract.address }

    return {
        contracts: [
            // Mint and Allowance needed for Setting Rewarder Rewards
            {
                contract: onEth(contract),
                config: {
                    allowance: {
                        [ethAdmin]: {
                            [ethRewarder.contract.address]: BigInt(24192e23),
                        },
                    },
                    mint: {
                        [ethAdmin]: BigInt(24192e23),
                    },
                },
            },
            {
                contract: onBsc(contract),
                config: {
                    allowance: {
                        [bscAdmin]: {
                            [bscRewarder.contract.address]: BigInt(24192e23),
                        },
                    },
                    mint: {
                        [bscAdmin]: BigInt(24192e23),
                    },
                },
            },
            {
                contract: onArb(contract),
                config: {
                    allowance: {
                        [arbAdmin]: {
                            [arbRewarder.contract.address]: BigInt(24192e23),
                        },
                    },
                    mint: {
                        [arbAdmin]: BigInt(24192e23),
                    },
                },
            },
            {
                contract: onOpt(contract),
                config: {
                    allowance: {
                        [optAdmin]: {
                            [optRewarder.contract.address]: BigInt(24192e23),
                        },
                    },
                    mint: {
                        [optAdmin]: BigInt(24192e23),
                    },
                },
            },
            // Mint and Allowance needed for Adding Liquidity to Pools
            {
                contract: ethUsdc,
                config: {
                    allowance: {
                        [ethAdmin]: {
                            [ethUsdcPool.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onEth(ethUsdtContract),
                config: {
                    allowance: {
                        [ethAdmin]: {
                            [ethUsdtPool.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: optUsdc,
                config: {
                    allowance: {
                        [optAdmin]: {
                            [optUsdcPool.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [optAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onOpt(optUsdtContract),
                config: {
                    allowance: {
                        [optAdmin]: {
                            [optUsdtPool.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [optAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: arbUsdc,
                config: {
                    allowance: {
                        [arbAdmin]: {
                            [arbUsdcPool.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [arbAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onArb(arbUsdtContract),
                config: {
                    allowance: {
                        [arbAdmin]: {
                            [arbUsdtPool.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [arbAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: bscUsdt,
                config: {
                    allowance: {
                        [bscAdmin]: {
                            [bscUsdtPool.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [bscAdmin]: BigInt(18e18),
                    },
                },
            },
        ],
        connections: [],
    }
}

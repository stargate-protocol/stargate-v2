import { REWARDS, RewardTokenName } from '@stargatefinance/stg-definitions-v2'
import { ERC20NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName, getUSDTDeployName } from '../../../ops/util'
import { getNamedAccount } from '../../../ts-src/utils/util'

import { onBsc, onEth, onPolygon } from './utils'

const contract = { contractName: REWARDS[RewardTokenName.MOCK_A].name }
const rewarder = { contractName: 'StargateMultiRewarder' }
const getDeployer = getNamedAccount('deployer')

export default async (): Promise<OmniGraphHardhat<ERC20NodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const bsc = await getEnvironment(EndpointId.BSC_V2_SANDBOX)
    const eth = await getEnvironment(EndpointId.ETHEREUM_V2_SANDBOX)
    const polygon = await getEnvironment(EndpointId.POLYGON_V2_SANDBOX)

    // Then grab the deployer account for each network to be used as the admin
    const bscAdmin = await bsc.getNamedAccounts().then(getDeployer)
    const ethAdmin = await eth.getNamedAccounts().then(getDeployer)
    const polygonAdmin = await polygon.getNamedAccounts().then(getDeployer)

    // Rewarder contracts to give allowance to
    const bscRewarder = await contractFactory(onBsc(rewarder))
    const ethRewarder = await contractFactory(onEth(rewarder))
    const polygonRewarder = await contractFactory(onPolygon(rewarder))

    // Pools contracts to give allowance to
    const ethUsdcPool = await contractFactory(onEth({ contractName: 'StargatePoolUSDC' }))
    const ethUsdtPool = await contractFactory(onEth({ contractName: 'StargatePoolUSDT' }))
    const polygonUsdtPool = await contractFactory(onPolygon({ contractName: 'StargatePoolUSDT' }))

    // Now we collect the addresses of the deployed assets to mint to the deployer to add liquidity to the pools
    const ethUSDCProxy = await contractFactory(onEth({ contractName: getUSDCProxyDeployName() }))
    const ethUSDC = onEth({ contractName: 'FiatTokenV2_2', address: ethUSDCProxy.contract.address })

    const ethUSDT = await contractFactory(onEth({ contractName: getUSDTDeployName() }))
    const polygonUSDT = await contractFactory(onPolygon({ contractName: getUSDTDeployName() }))

    const ethUSDTContract = { address: ethUSDT.contract.address }
    const polygonUSDTContract = { address: polygonUSDT.contract.address }

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
                contract: onPolygon(contract),
                config: {
                    allowance: {
                        [polygonAdmin]: {
                            [polygonRewarder.contract.address]: BigInt(24192e23),
                        },
                    },
                    mint: {
                        [polygonAdmin]: BigInt(24192e23),
                    },
                },
            },
            // Mint and Allowance needed for Adding Liquidity to Pools
            {
                contract: ethUSDC,
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
                contract: onEth(ethUSDTContract),
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
                contract: onPolygon(polygonUSDTContract),
                config: {
                    allowance: {
                        [polygonAdmin]: {
                            [polygonUsdtPool.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [polygonAdmin]: BigInt(18e18),
                    },
                },
            },
        ],
        connections: [],
    }
}

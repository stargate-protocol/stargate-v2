import { ASSETS, REWARDS, RewardTokenName, StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ERC20NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDTDeployName } from '../../../ops/util'
import { getNamedAccount } from '../../../ts-src/utils/util'
import { getContractWithEid } from '../utils'
import { getChainsThatSupportRewarder, getChainsThatSupportTokenWithType } from '../utils/utils.config'

import { setTestnetStage } from './utils'

const rewarderTokenContract = { contractName: REWARDS[RewardTokenName.MOCK_A].name }
const getDeployer = getNamedAccount('deployer')

const rewarder = { contractName: 'StargateMultiRewarder' }
const usdcPool = { contractName: 'StargatePoolUSDC' }
const eurcPool = { contractName: 'StargatePoolEURC' }
const usdtPool = { contractName: 'StargatePoolUSDT' }

export default async (): Promise<OmniGraphHardhat<ERC20NodeConfig, unknown>> => {
    // set testnet stage
    setTestnetStage()

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getHre = createGetHreByEid()
    const contractFactory = createContractFactory(getHre)

    const chainsSupportingRewards = getChainsThatSupportRewarder()

    // getting the rewarder configs
    const rewarderContracts = await Promise.all(
        chainsSupportingRewards.map(async (chain) => {
            const contract = getContractWithEid(chain.eid, rewarderTokenContract)
            const hre = await getHre(chain.eid)
            const deployer = await hre.getNamedAccounts().then(getDeployer)
            const rewarderContract = await contractFactory(getContractWithEid(chain.eid, rewarder))
            return {
                contract,
                config: {
                    allowance: {
                        [deployer]: {
                            [rewarderContract.contract.address]: BigInt(24192e23),
                        },
                    },
                    mint: {
                        [deployer]: BigInt(24192e23),
                    },
                },
            }
        })
    )

    // getting the pools configs

    // get all chains that has pool
    const usdtChains = getChainsThatSupportTokenWithType(TokenName.USDT, StargateType.Pool)
    const usdcChains = getChainsThatSupportTokenWithType(TokenName.USDC, StargateType.Pool)
    const eurcChains = getChainsThatSupportTokenWithType(TokenName.EURC, StargateType.Pool)

    // usdt pools
    const usdtPoolsContracts = await Promise.all(
        usdtChains.map(async (chain) => {
            const hre = await getHre(chain.eid)

            // get the contract address from the ASSETS or deployed contract
            const constantDefinedAddr = ASSETS[TokenName.USDT].networks[chain.eid as EndpointId]?.address
            const contractAddress = constantDefinedAddr
                ? constantDefinedAddr
                : (await contractFactory(getContractWithEid(chain.eid, { contractName: getUSDTDeployName() }))).contract
                      .address

            const deployer = await hre.getNamedAccounts().then(getDeployer)
            const poolContract = await contractFactory(getContractWithEid(chain.eid, usdtPool))

            return {
                contract: getContractWithEid(chain.eid, { address: contractAddress }),
                config: {
                    allowance: {
                        [deployer]: {
                            [poolContract.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [deployer]: BigInt(18e18),
                    },
                },
            }
        })
    )

    // usdc pools
    const usdcPoolsContracts = await Promise.all(
        usdcChains.map(async (chain) => {
            const hre = await getHre(chain.eid)

            const contract = {
                contractName: 'FiatTokenV2_2',
                address: ASSETS[TokenName.USDC].networks[chain.eid as EndpointId]?.address,
            }
            const deployer = await hre.getNamedAccounts().then(getDeployer)
            const poolContract = await contractFactory(getContractWithEid(chain.eid, usdcPool))
            return {
                contract: getContractWithEid(chain.eid, contract),
                config: {
                    allowance: {
                        [deployer]: {
                            [poolContract.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [deployer]: BigInt(18e18),
                    },
                },
            }
        })
    )

    // eurc pools
    const eurcPoolsContracts = await Promise.all(
        eurcChains.map(async (chain) => {
            const hre = await getHre(chain.eid)

            const contract = {
                contractName: 'FiatTokenV2_2',
                address: ASSETS[TokenName.EURC].networks[chain.eid as EndpointId]?.address,
            }
            const deployer = await hre.getNamedAccounts().then(getDeployer)
            const poolContract = await contractFactory(getContractWithEid(chain.eid, eurcPool))
            return {
                contract: getContractWithEid(chain.eid, contract),
                config: {
                    allowance: {
                        [deployer]: {
                            [poolContract.contract.address]: BigInt(18e18),
                        },
                    },
                    mint: {
                        [deployer]: BigInt(18e18),
                    },
                },
            }
        })
    )

    return {
        contracts: [...rewarderContracts, ...usdtPoolsContracts, ...usdcPoolsContracts, ...eurcPoolsContracts],
        connections: [],
    }
}

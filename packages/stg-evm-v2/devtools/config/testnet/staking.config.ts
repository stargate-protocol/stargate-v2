import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { StakingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import {
    OmniGraphHardhat,
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getContractWithEid } from '../utils'
import { filterValidProvidedChains, getChainsThatSupportStaking, getTokenName } from '../utils.config'

import { getLPTokenAddress } from './shared'
import { setTestnetStage } from './utils'

const rewarder = { contractName: 'StargateMultiRewarder' }
const staking = { contractName: 'StargateStaking' }

export default async (): Promise<OmniGraphHardhat<StakingNodeConfig, never>> => {
    // Set the stage to testnet
    setTestnetStage()

    const getEnvironment = createGetHreByEid()
    const contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment))

    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    // get valid chains config in the chainsList
    const validChains = filterValidProvidedChains(chainsList, getChainsThatSupportStaking())

    const contracts = await Promise.all(
        validChains.map(async (chain) => {
            // pool for each lp token
            const pools = await Promise.all(
                Object.entries(chain.staking?.tokens ?? {}).map(async ([stakingToken]) => {
                    const tokenAddress = await getLPTokenAddress(
                        getEnvironment,
                        chain.eid as EndpointId,
                        getTokenName(stakingToken) as TokenName
                    )
                    return {
                        rewarder: (await contractFactory(getContractWithEid(chain.eid, rewarder))).contract.address,
                        token: tokenAddress,
                    }
                })
            )

            return {
                contract: getContractWithEid(chain.eid, staking),
                config: {
                    pools,
                },
            }
        })
    )

    return { contracts, connections: [] }
}

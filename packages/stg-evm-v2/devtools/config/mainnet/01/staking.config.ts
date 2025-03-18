import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { StakingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import {
    OmniGraphHardhat,
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getContractWithEid, getSafeAddress } from '../../utils'
import { getChainsThatSupportStaking } from '../utils'

import { getLPTokenAddress } from './shared'

const rewarder = { contractName: 'StargateMultiRewarder' }
const staking = { contractName: 'StargateStaking' }

export default async (): Promise<OmniGraphHardhat<StakingNodeConfig, never>> => {
    const getEnvironment = createGetHreByEid()
    const contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment))

    const contracts = await Promise.all(
        getChainsThatSupportStaking().map(async (chain) => {
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
                    owner: getSafeAddress(chain.eid),
                    pools,
                },
            }
        })
    )

    return { contracts, connections: [] }
}

function getTokenName(token: string): TokenName {
    // return the name that match the entry
    const name = Object.entries(TokenName).find(([key, value]) => value.toLowerCase() === token)?.[0] as
        | TokenName
        | undefined
    if (!name) {
        throw new Error(`Token ${token} not found`)
    }
    return name
}

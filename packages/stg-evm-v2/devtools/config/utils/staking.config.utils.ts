import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { StakingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import {
    OmniGraphHardhat,
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId, Stage } from '@layerzerolabs/lz-definitions'

import { getContractWithEid, getOneSigAddressMaybe } from '../utils'

import { getLPTokenAddress } from './shared'
import { filterValidProvidedChains, getChainsThatSupportStaking, getTokenName, setStage } from './utils.config'

export default async function buildStakingGraph(
    stage: Stage,
    rewarder: { contractName: string },
    staking: { contractName: string }
): Promise<OmniGraphHardhat<StakingNodeConfig, never>> {
    // Set the correct stage
    setStage(stage)

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
            const stargateOnesig = getOneSigAddressMaybe(chain.eid)

            return {
                contract: getContractWithEid(chain.eid, staking),
                config: {
                    // Only set owner if defined in the chain config
                    ...(stargateOnesig !== undefined ? { owner: stargateOnesig } : {}),
                    pools,
                },
            }
        })
    )

    return { contracts, connections: [] }
}

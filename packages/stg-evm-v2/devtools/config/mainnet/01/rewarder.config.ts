import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { RewarderNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetRewardTokenAddresses } from '../../../../ts-src/utils/util'
import { getContractWithEid, getSafeAddress } from '../../utils'
import { filterValidProvidedChains, getChainsThatSupportRewarder, getRewardTokenName, getTokenName } from '../utils'

import { getLPTokenAddress } from './shared'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    // get valid chains config in the chainsList
    const validChains = filterValidProvidedChains(chainsList, getChainsThatSupportRewarder())

    const getRewardTokenAddresses = createGetRewardTokenAddresses(getEnvironment)

    const contracts = await Promise.all(
        validChains.map(async (chain) => {
            // build the allocations object
            const allocations = await Promise.all(
                Object.entries(chain.rewarder?.tokens ?? {}).map(async ([token, allocations]) => {
                    const rewardTokenName = getRewardTokenName(token)

                    // build each token allocation object
                    const allocationsPerToken = await Promise.all(
                        Object.entries(allocations.allocation).map(async ([lpToken, amount]) => {
                            const lpTokenAddress = await getLPTokenAddress(
                                getEnvironment,
                                chain.eid as EndpointId,
                                getTokenName(lpToken) as TokenName
                            )
                            return { [lpTokenAddress]: amount }
                        })
                    ).then((results) => Object.assign({}, ...results))

                    const rewardTokenAddress = await getRewardTokenAddresses(chain.eid, [rewardTokenName])
                    return {
                        [rewardTokenAddress[rewardTokenName]]: allocationsPerToken,
                    }
                })
            ).then((results) => Object.assign({}, ...results))

            return {
                contract: getContractWithEid(chain.eid, contract),
                config: {
                    owner: getSafeAddress(chain.eid),
                    allocations: allocations,
                },
            }
        })
    )

    return {
        contracts,
        connections: [],
    }
}

import { RewardTokenName, TokenName } from '@stargatefinance/stg-definitions-v2'
import { RewarderNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetRewardTokenAddresses } from '../../../../ts-src/utils/util'
import { getContractWithEid, getSafeAddress } from '../../utils'
import { getChainsThatSupportRewarder } from '../utils'

import { getLPTokenAddress } from './shared'

const contract = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<RewarderNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const supportedChains = getChainsThatSupportRewarder()

    const getRewardTokenAddresses = createGetRewardTokenAddresses(getEnvironment)

    const contracts = await Promise.all(
        supportedChains.map(async (chain) => {
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

function getRewardTokenName(token: string): RewardTokenName {
    // return the name that match the entry
    const name = Object.entries(RewardTokenName).find(([value]) => value.toLowerCase() === token)?.[0] as
        | RewardTokenName
        | undefined
    if (!name) {
        throw new Error(`Token ${token} not found`)
    }
    return name
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

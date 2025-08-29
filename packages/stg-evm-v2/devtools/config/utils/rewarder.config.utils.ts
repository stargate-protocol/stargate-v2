import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { RewarderNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId, Stage } from '@layerzerolabs/lz-definitions'

import { createGetRewardTokenAddresses } from '../../../ts-src/utils/util'
import { getContractWithEid, getOneSigAddressMaybe } from '../utils'

import { getLPTokenAddress } from './shared'
import {
    filterValidProvidedChains,
    getChainsThatSupportRewarder,
    getRewardTokenName,
    getTokenName,
    setStage,
} from './utils.config'

export default async function buildRewarderGraph(
    stage: Stage,
    contract: { contractName: string }
): Promise<OmniGraphHardhat<RewarderNodeConfig, unknown>> {
    // Set the correct stage
    setStage(stage)

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

            const stargateOnesig = getOneSigAddressMaybe(chain.eid)

            return {
                contract: getContractWithEid(chain.eid, contract),
                config: {
                    // Only set owner if defined in the chain config
                    ...(stargateOnesig !== undefined ? { owner: stargateOnesig } : {}),

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

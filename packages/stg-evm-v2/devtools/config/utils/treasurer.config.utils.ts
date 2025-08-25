import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { TreasurerNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId, Stage } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses, createGetDeployer } from '../../../ts-src/utils/util'
import { getContractWithEid, getSafeAddress } from '../utils'

import { filterValidProvidedChains, getChainsThatSupportTreasurer, getTokenName, setStage } from './utils.config'

export default async function buildTreasurerGraph(
    stage: Stage,
    contract: { contractName: string }
): Promise<OmniGraphHardhat<TreasurerNodeConfig, unknown>> {
    // Set the correct stage
    setStage(stage)

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const getDeployer = createGetDeployer(getEnvironment)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    // get valid chains config in the chainsList
    const validChains = filterValidProvidedChains(chainsList, getChainsThatSupportTreasurer())

    const contracts = await Promise.all(
        validChains.map(async (chain) => {
            // assets per chain
            const assets = await Promise.all(
                Object.entries(chain.treasurer?.tokens ?? {}).map(async ([asset]) => {
                    const tokenName = getTokenName(asset) as TokenName
                    const tokenAddress = (await getAssetAddresses(chain.eid as EndpointId, [tokenName]))[tokenName]
                    return {
                        [tokenAddress]: true,
                    }
                })
            ).then((results) => Object.assign({}, ...results))

            return {
                contract: getContractWithEid(chain.eid, contract),
                config: {
                    // Only set owner for mainnet
                    ...(stage === Stage.MAINNET ? { owner: getSafeAddress(chain.eid) } : {}),
                    admin: stage === Stage.MAINNET ? getSafeAddress(chain.eid) : await getDeployer(chain.eid),
                    assets,
                },
            }
        })
    )

    return { contracts, connections: [] }
}

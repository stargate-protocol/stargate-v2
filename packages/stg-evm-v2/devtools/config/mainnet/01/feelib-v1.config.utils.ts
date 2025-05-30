import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getContractWithEid } from '../../utils'
import { filterValidProvidedChains, getChainsThatSupportToken } from '../utils'

import { DEFAULT_PLANNER } from './constants'

export default async function buildFeeLibV1DeploymentGraph(
    tokenName: TokenName,
    contract: { contractName: string },
    chainsList: string[]
): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    // get valid chains config in the chainsList
    const validChains = filterValidProvidedChains(chainsList, getChainsThatSupportToken(tokenName))

    const contracts = Array.from(validChains).map((chain) => {
        return {
            contract: getContractWithEid(chain.eid, contract),
            config: defaultNodeConfig,
        }
    })

    return {
        contracts,
        connections: [],
    }
}

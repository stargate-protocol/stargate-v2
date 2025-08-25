import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import { getFeeLibV1DeployName } from '../../../ops/util'
import { getContractWithEid } from '../utils'

import { filterValidProvidedChains, getChainsThatSupportToken, printChains, setStage } from './utils.config'

export default async function buildFeeLibV1DeploymentGraph(
    stage: Stage,
    tokenName: TokenName,
    defaultPlanner: string
): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> {
    // Set the correct stage
    setStage(stage)

    const contract = { contractName: getFeeLibV1DeployName(tokenName) }

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    const defaultNodeConfig = {
        owner: defaultPlanner,
    }

    // get valid chains config in the chainsList
    const validChains = filterValidProvidedChains(chainsList, getChainsThatSupportToken(tokenName))

    printChains(`feelib_v1.${tokenName} CHAINS_LIST:`, validChains)

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

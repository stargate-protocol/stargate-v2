import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import { getContractWithEid } from '../../utils'
import { getChainsThatSupportToken, validateChains } from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.ETH
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []
    validateChains(chainsList)

    // get valid chains in the chainsList
    const supportedChains = getChainsThatSupportToken(tokenName)
    const validChains =
        chainsList?.length != 0 ? supportedChains.filter((chain) => chainsList.includes(chain.name)) : supportedChains

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

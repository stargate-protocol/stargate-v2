import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../ops/util'
import { getContractWithEid, setsDifference } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { allSupportedChains, chainEids } from './utils'

const tokenName = TokenName.USDT
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    // all defined chains except excluded ones will be considered valid
    const validChains = setsDifference(allSupportedChains, excludedChains)

    // Now we get the contracts for the valid chains
    const contracts = Array.from(validChains).map((chain) => {
        return {
            contract: getContractWithEid(chainEids[chain as keyof typeof chainEids], contract),
            config: defaultNodeConfig,
        }
    })

    return {
        contracts,
        connections: [],
    }
}

const excludedChains = new Set([
    // Add chains that should be excluded from usdt feelib v1 config
])

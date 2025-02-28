import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import { getContractWithEid, setsDifference } from '../../utils'
import { allSupportedChains, chainEids } from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.ETH
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

/**
 * total mainnet chains supported 59
 * excluded chains 28
 * valid chains 31
 */
const excludedChains = new Set([
    'astar-mainnet',
    'aurora-mainnet',
    'avalanche-mainnet',
    'blast-mainnet',
    'bsc-mainnet',
    'codex-mainnet',
    'coredao-mainnet',
    'ebi-mainnet',
    'etherlink-mainnet',
    'fantom-mainnet',
    'fraxtal-mainnet',
    'ink-mainnet',
    'kava-mainnet',
    'manta-mainnet',
    'mode-mainnet',
    'moonbeam-mainnet',
    'moonriver-mainnet',
    'opbnb-mainnet',
    'plume-mainnet',
    'polygon-mainnet',
    'rarible-mainnet',
    'shimmer-mainnet',
    'sonic-mainnet',
    'superposition-mainnet',
    'taiko-mainnet',
    'xchain-mainnet',
    'zkatana-mainnet',
    'zkpolygon-mainnet',
    // Add chains that should be excluded from eth feelib v1 config
])

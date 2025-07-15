import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import { getContractWithEid, setsDifference } from '../../utils'
import { allSupportedChains, chainEids, isValidChain } from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.USDT
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    // defined chains will be all supported chains or only the ones defined in the env vars
    const chainsList = process.env.CHAINS_LIST ? new Set(process.env.CHAINS_LIST.split(',')) : allSupportedChains

    // check if all chains are valid
    chainsList.forEach((chain) => {
        if (!isValidChain(chain)) {
            throw new Error(`Invalid chain: ${chain}`)
        }
    })

    // all defined chains except excluded ones will be considered valid
    const validChains = setsDifference(chainsList, excludedChains)

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
 * excluded chains 27
 * valid chains 33
 */
const excludedChains = new Set([
    'astar-mainnet',
    'aurora-mainnet',
    'base-mainnet',
    'bera-mainnet',
    'blast-mainnet',
    'botanix-mainnet',
    'codex-mainnet',
    'cronosevm-mainnet',
    'cronoszkevm-mainnet',
    'etherlink-mainnet',
    'fantom-mainnet',
    'fraxtal-mainnet',
    'gnosis-mainnet',
    'ink-mainnet',
    'manta-mainnet',
    'mode-mainnet',
    'moonbeam-mainnet',
    'moonriver-mainnet',
    'opbnb-mainnet',
    'scroll-mainnet',
    'shimmer-mainnet',
    'sophon-mainnet',
    'soneium-mainnet',
    'sonic-mainnet',
    'superposition-mainnet',
    'swell-mainnet',
    'unichain-mainnet',
    'xchain-mainnet',
    'zkconsensys-mainnet',
    'zkpolygon-mainnet',
    // Add chains that should be excluded from usdt feelib v1 config
])

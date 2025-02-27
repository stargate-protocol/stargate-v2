import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../utils'
import { generateAssetConfig, setsDifference } from '../../utils'
import { allSupportedChains, chainEids } from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.ETH

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // all defined chains except excluded ones will be considered valid
    const validChains = setsDifference(allSupportedChains, excludedChains)

    // Now we define all the contracts (from the valid chains set)
    const points = Array.from(validChains).map((chain) => getAssetPoint(chainEids[chain as keyof typeof chainEids]))

    // And all their nodes (from the valid chains set)
    const contracts = await Promise.all(points.map(async (point) => await getAssetNode(point)))

    return {
        contracts,
        connections: generateAssetConfig(tokenName, points),
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
    // Add chains that should be excluded from eth asset config
])

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { createGetAssetNode, createGetAssetOmniPoint } from '../../utils'
import { generateAssetConfig, setsDifference } from '../utils'

import { allSupportedChains, chainEids } from './utils'

const tokenName = TokenName.USDC

const getAssetPoint = createGetAssetOmniPoint(tokenName)

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName)

    // all defined chains except excluded ones will be considered valid
    const validChains = setsDifference(allSupportedChains, excludedChains)
    // if the evn variable is not defined, use the validChains
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : validChains

    // Now we define all the contracts (from the valid chains set)
    const points = Array.from(chainsList).map((chain) => getAssetPoint(chainEids[chain as keyof typeof chainEids]))

    // And all their nodes (from the valid chains set)
    const contracts = await Promise.all(points.map(async (point) => await getAssetNode(point)))

    return {
        contracts,
        connections: generateAssetConfig(tokenName, points),
    }
}

const excludedChains = new Set([
    'bsc-testnet',
    // Add chains that should be excluded from usdc asset config
])

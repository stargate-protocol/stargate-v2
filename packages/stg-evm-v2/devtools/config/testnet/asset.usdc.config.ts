import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { createGetAssetNode, createGetAssetOmniPoint } from '../../utils'
import { generateAssetConfig, setsDifference } from '../utils'

import { allSupportedChains, chainEids, isValidChain } from './utils'

const tokenName = TokenName.USDC

const getAssetPoint = createGetAssetOmniPoint(tokenName)

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName)

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

    // Now we define all the contracts (from the valid chains set)
    const points = Array.from(validChains).map((chain) => getAssetPoint(chainEids[chain as keyof typeof chainEids]))

    // And all their nodes (from the valid chains set)
    const contracts = await Promise.all(points.map(async (point) => await getAssetNode(point)))

    return {
        contracts,
        connections: generateAssetConfig(tokenName, points),
    }
}

const excludedChains = new Set([
    'bsc-testnet',
    'avalanche-testnet',
    // Add chains that should be excluded from usdc asset config
])

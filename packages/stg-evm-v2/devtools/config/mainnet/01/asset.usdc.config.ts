import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../utils'
import { generateAssetConfig } from '../../utils'
import { getChainsThatSupportToken, isValidChain } from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.USDC

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : ''

    // check if all chains are valid
    if (chainsList) {
        chainsList.forEach((chain) => {
            if (!isValidChain(chain)) {
                throw new Error(`Invalid chain: ${chain}`)
            }
        })
    }

    // get valid chains in the chainsList
    const supportedChains = getChainsThatSupportToken(tokenName)

    const validChains = chainsList
        ? supportedChains.filter((chain) => chainsList.includes(chain.name))
        : supportedChains

    // Now we define all the contracts (from the valid chains set)
    const points = Array.from(validChains).map((chain) => getAssetPoint(chain.eid))

    // And all their nodes (from the valid chains set)
    const contracts = await Promise.all(points.map(async (point) => await getAssetNode(point)))

    return {
        contracts,
        connections: generateAssetConfig(tokenName, points),
    }
}

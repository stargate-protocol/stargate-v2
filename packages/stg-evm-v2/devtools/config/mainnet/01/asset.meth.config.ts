import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../src/asset/utils'
import { generateAssetConfig } from '../../utils'

import { DEFAULT_PLANNER } from './constants'

import type { AssetEdgeConfig, AssetNodeConfig } from '../../../src/asset'

const tokenName = TokenName.mETH

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // Now we define all the contracts
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLE_V2_MAINNET)

    // And all their nodes
    const ethContract = await getAssetNode(ethPoint)
    const mantleContract = await getAssetNode(mantlePoint)

    return {
        contracts: [ethContract, mantleContract],
        connections: generateAssetConfig(tokenName, [ethPoint, mantlePoint]),
    }
}

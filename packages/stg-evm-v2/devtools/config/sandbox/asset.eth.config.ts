import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetEdge, createGetAssetNode, createGetAssetOmniPoint } from '../../utils'

const tokenName = TokenName.ETH

const getAssetPoint = createGetAssetOmniPoint(tokenName)

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getAssetNode = createGetAssetNode(tokenName)
    const getAssetEdge = createGetAssetEdge(tokenName)

    // Now we define all the contracts
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_SANDBOX)
    const polygonPoint = getAssetPoint(EndpointId.POLYGON_V2_SANDBOX)

    // And all their nodes
    const ethContract = await getAssetNode(ethPoint)
    const polygonContract = await getAssetNode(polygonPoint)

    // And all their connections
    const ethToPolygon = getAssetEdge(ethPoint, polygonPoint)
    const polygonToEth = getAssetEdge(polygonPoint, ethPoint)

    return {
        contracts: [ethContract, polygonContract],
        connections: [ethToPolygon, polygonToEth],
    }
}

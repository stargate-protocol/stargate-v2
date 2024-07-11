import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetEdge, createGetAssetNode, createGetAssetOmniPoint } from '../../utils'

const tokenName = TokenName.USDC

const getAssetPoint = createGetAssetOmniPoint(tokenName)

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getAssetNode = createGetAssetNode(tokenName)
    const getAssetEdge = createGetAssetEdge(tokenName)

    // Now we define all the contracts
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_SANDBOX)
    const polygonPoint = getAssetPoint(EndpointId.POLYGON_V2_SANDBOX)
    const bscPoint = getAssetPoint(EndpointId.BSC_V2_SANDBOX)

    // And all their nodes
    const ethContract = await getAssetNode(ethPoint)
    const polygonContract = await getAssetNode(polygonPoint)
    const bscContract = await getAssetNode(bscPoint)

    // And all their connections
    const ethToPolygon = getAssetEdge(ethPoint, polygonPoint)
    const ethToBsc = getAssetEdge(ethPoint, bscPoint)
    const polygonToEth = getAssetEdge(polygonPoint, ethPoint)
    const polygonToBsc = getAssetEdge(polygonPoint, bscPoint)
    const bscToEth = getAssetEdge(bscPoint, ethPoint)
    const bscToPolygon = getAssetEdge(bscPoint, polygonPoint)

    return {
        contracts: [ethContract, polygonContract, bscContract],
        connections: [ethToPolygon, ethToBsc, polygonToEth, polygonToBsc, bscToEth, bscToPolygon],
    }
}

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetEdge, createGetAssetNode, createGetAssetOmniPoint } from '../../utils'

const tokenName = TokenName.USDC

const getAssetPoint = createGetAssetOmniPoint(tokenName)

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName)
    const getAssetEdge = createGetAssetEdge(tokenName)

    // Now we define all the contracts
    const ethPoint = getAssetPoint(EndpointId.SEPOLIA_V2_TESTNET)
    const optPoint = getAssetPoint(EndpointId.OPTSEP_V2_TESTNET)
    const arbPoint = getAssetPoint(EndpointId.ARBSEP_V2_TESTNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_TESTNET)

    // And all their nodes
    const ethContract = await getAssetNode(ethPoint)
    const optContract = await getAssetNode(optPoint)
    const arbContract = await getAssetNode(arbPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)

    // And all their connections
    const ethToOpt = getAssetEdge(ethPoint, optPoint)
    const ethToArb = getAssetEdge(ethPoint, arbPoint)
    const ethToKlaytn = getAssetEdge(ethPoint, klaytnPoint)

    const optToEth = getAssetEdge(optPoint, ethPoint)
    const optToArb = getAssetEdge(optPoint, arbPoint)
    const optToKlaytn = getAssetEdge(optPoint, klaytnPoint)

    const arbToEth = getAssetEdge(arbPoint, ethPoint)
    const arbToOpt = getAssetEdge(arbPoint, optPoint)
    const arbToKlaytn = getAssetEdge(arbPoint, klaytnPoint)

    const klaytnToEth = getAssetEdge(klaytnPoint, ethPoint)
    const klaytnToOpt = getAssetEdge(klaytnPoint, optPoint)
    const klaytnToArb = getAssetEdge(klaytnPoint, arbPoint)

    return {
        contracts: [ethContract, optContract, arbContract, klaytnContract],
        connections: [
            //
            // Connections originating from ETH
            //
            ethToOpt,
            ethToArb,
            ethToKlaytn,

            //
            // Connections originating from OPT
            //
            optToEth,
            optToArb,
            optToKlaytn,

            //
            // Connections originating from ARB
            //
            arbToEth,
            arbToOpt,
            arbToKlaytn,

            //
            // Connections originating from KLAYTN
            //
            klaytnToEth,
            klaytnToOpt,
            klaytnToArb,
        ],
    }
}

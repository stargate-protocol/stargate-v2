import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetEdge, createGetAssetNode, createGetAssetOmniPoint } from '../../utils'

const tokenName = TokenName.ETH

const getAssetPoint = createGetAssetOmniPoint(tokenName)

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName)
    const getAssetEdge = createGetAssetEdge(tokenName)

    // Now we define all the contracts
    const absPoint = getAssetPoint(EndpointId.ABSTRACT_V2_TESTNET)
    const ethPoint = getAssetPoint(EndpointId.SEPOLIA_V2_TESTNET)
    const optPoint = getAssetPoint(EndpointId.OPTSEP_V2_TESTNET)
    const arbPoint = getAssetPoint(EndpointId.ARBSEP_V2_TESTNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_TESTNET)

    // And all their nodes
    const absContract = await getAssetNode(absPoint)
    const ethContract = await getAssetNode(ethPoint)
    const optContract = await getAssetNode(optPoint)
    const arbContract = await getAssetNode(arbPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)

    // And all their connections
    const ethToAbs = getAssetEdge(ethPoint, absPoint)
    const ethToOpt = getAssetEdge(ethPoint, optPoint)
    const ethToArb = getAssetEdge(ethPoint, arbPoint)
    const ethToKlaytn = getAssetEdge(ethPoint, klaytnPoint)

    const optToAbs = getAssetEdge(optPoint, absPoint)
    const optToEth = getAssetEdge(optPoint, ethPoint)
    const optToArb = getAssetEdge(optPoint, arbPoint)
    const optToKlaytn = getAssetEdge(optPoint, klaytnPoint)

    const arbToAbs = getAssetEdge(arbPoint, absPoint)
    const arbToEth = getAssetEdge(arbPoint, ethPoint)
    const arbToOpt = getAssetEdge(arbPoint, optPoint)
    const arbToKlaytn = getAssetEdge(arbPoint, klaytnPoint)

    const klaytnToAbs = getAssetEdge(klaytnPoint, absPoint)
    const klaytnToEth = getAssetEdge(klaytnPoint, ethPoint)
    const klaytnToOArb = getAssetEdge(klaytnPoint, arbPoint)
    const klaytnToOpt = getAssetEdge(klaytnPoint, optPoint)

    return {
        contracts: [ethContract, optContract, arbContract, klaytnContract, absContract],
        connections: [
            //
            // Connections originating from ETH
            //
            ethToAbs,
            ethToOpt,
            ethToArb,
            ethToKlaytn,

            //
            // Connections originating from OPT
            //
            optToAbs,
            optToEth,
            optToArb,
            optToKlaytn,

            //
            // Connections originating from ARB
            //
            arbToAbs,
            arbToEth,
            arbToOpt,
            arbToKlaytn,

            //
            // Connections originating from KLAYTN
            //
            klaytnToAbs,
            klaytnToEth,
            klaytnToOArb,
            klaytnToOpt,
        ],
    }
}

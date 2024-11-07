import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetEdge, createGetAssetNode, createGetAssetOmniPoint } from '../../utils'

const tokenName = TokenName.USDT

const getAssetPoint = createGetAssetOmniPoint(tokenName)

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName)
    const getAssetEdge = createGetAssetEdge(tokenName)

    // Now we define all the contracts
    const bscPoint = getAssetPoint(EndpointId.BSC_V2_TESTNET)
    const ethPoint = getAssetPoint(EndpointId.SEPOLIA_V2_TESTNET)
    const optPoint = getAssetPoint(EndpointId.OPTSEP_V2_TESTNET)
    const arbPoint = getAssetPoint(EndpointId.ARBSEP_V2_TESTNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_TESTNET)
    // const absPoint = getAssetPoint(EndpointId.ABSTRACT_V2_TESTNET)

    // And all their nodes
    const bscContract = await getAssetNode(bscPoint)
    const ethContract = await getAssetNode(ethPoint)
    const optContract = await getAssetNode(optPoint)
    const arbContract = await getAssetNode(arbPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    // const absContract = await getAssetNode(absPoint)

    // And all their connections
    const bscToEth = getAssetEdge(bscPoint, ethPoint)
    const bscToOpt = getAssetEdge(bscPoint, optPoint)
    const bscToArb = getAssetEdge(bscPoint, arbPoint)
    const bscToKlaytn = getAssetEdge(bscPoint, klaytnPoint)
    // const bscToAbs = getAssetEdge(bscPoint, absPoint)

    const ethToBsc = getAssetEdge(ethPoint, bscPoint)
    const ethToOpt = getAssetEdge(ethPoint, optPoint)
    const ethToArb = getAssetEdge(ethPoint, arbPoint)
    const ethToKlaytn = getAssetEdge(ethPoint, klaytnPoint)
    // const ethToAbs = getAssetEdge(ethPoint, absPoint)

    const optToBsc = getAssetEdge(optPoint, bscPoint)
    const optToEth = getAssetEdge(optPoint, ethPoint)
    const optToArb = getAssetEdge(optPoint, arbPoint)
    const optToKlaytn = getAssetEdge(optPoint, klaytnPoint)
    // const optToAbs = getAssetEdge(optPoint, absPoint)

    const arbToBsc = getAssetEdge(arbPoint, bscPoint)
    const arbToEth = getAssetEdge(arbPoint, ethPoint)
    const arbToOpt = getAssetEdge(arbPoint, optPoint)
    const arbToKlaytn = getAssetEdge(arbPoint, klaytnPoint)
    // const arbToAbs = getAssetEdge(arbPoint, absPoint)

    const klaytnToBsc = getAssetEdge(klaytnPoint, bscPoint)
    const klaytnToEth = getAssetEdge(klaytnPoint, ethPoint)
    const klaytnToOArb = getAssetEdge(klaytnPoint, arbPoint) // typo in variable name? TODO
    const klaytnToOpt = getAssetEdge(klaytnPoint, optPoint)
    // const klaytnToAbs = getAssetEdge(klaytnPoint, absPoint)

    // const absToBsc = getAssetEdge(absPoint, bscPoint)
    // const absToEth = getAssetEdge(absPoint, ethPoint)
    // const absToOpt = getAssetEdge(absPoint, optPoint)
    // const absToArb = getAssetEdge(absPoint, arbPoint)
    // const absToKlaytn = getAssetEdge(absPoint, klaytnPoint)

    return {
        contracts: [bscContract, ethContract, optContract, arbContract, klaytnContract /*, absContract*/],
        connections: [
            //
            // Connections originating from BSC
            //
            bscToEth,
            bscToOpt,
            bscToArb,
            bscToKlaytn,
            // bscToAbs,

            //
            // Connections originating from ETH
            //
            ethToBsc,
            ethToOpt,
            ethToArb,
            ethToKlaytn,
            // ethToAbs,

            //
            // Connections originating from OPT
            //
            optToBsc,
            optToEth,
            optToArb,
            optToKlaytn,
            // optToAbs,

            //
            // Connections originating from ARB
            //
            arbToBsc,
            arbToEth,
            arbToOpt,
            arbToKlaytn,
            // arbToAbs,

            //
            // Connections originating from KLAYTN
            //
            klaytnToBsc,
            klaytnToEth,
            klaytnToOArb,
            klaytnToOpt,
            // klaytnToAbs,

            //
            // Connections originating from ABS
            //
            // absToBsc,
            // absToEth,
            // absToOpt,
            // absToArb,
            // absToKlaytn,
        ],
    }
}

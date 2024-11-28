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
    const bl3Point = getAssetPoint(EndpointId.BL3_V2_TESTNET)

    // And all their nodes
    const bscContract = await getAssetNode(bscPoint)
    const ethContract = await getAssetNode(ethPoint)
    const optContract = await getAssetNode(optPoint)
    const arbContract = await getAssetNode(arbPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const bl3Contract = await getAssetNode(bl3Point)

    // And all their connections
    const bscToEth = getAssetEdge(bscPoint, ethPoint)
    const bscToOpt = getAssetEdge(bscPoint, optPoint)
    const bscToArb = getAssetEdge(bscPoint, arbPoint)
    const bscToKlaytn = getAssetEdge(bscPoint, klaytnPoint)
    const bscToBL3 = getAssetEdge(bscPoint, bl3Point)

    const ethToBsc = getAssetEdge(ethPoint, bscPoint)
    const ethToOpt = getAssetEdge(ethPoint, optPoint)
    const ethToArb = getAssetEdge(ethPoint, arbPoint)
    const ethToKlaytn = getAssetEdge(ethPoint, klaytnPoint)
    const ethToBL3 = getAssetEdge(ethPoint, bl3Point)

    const optToBsc = getAssetEdge(optPoint, bscPoint)
    const optToEth = getAssetEdge(optPoint, ethPoint)
    const optToArb = getAssetEdge(optPoint, arbPoint)
    const optToKlaytn = getAssetEdge(optPoint, klaytnPoint)
    const optToBL3 = getAssetEdge(optPoint, bl3Point)

    const arbToBsc = getAssetEdge(arbPoint, bscPoint)
    const arbToEth = getAssetEdge(arbPoint, ethPoint)
    const arbToOpt = getAssetEdge(arbPoint, optPoint)
    const arbToKlaytn = getAssetEdge(arbPoint, klaytnPoint)
    const arbToBL3 = getAssetEdge(arbPoint, bl3Point)

    const klaytnToBsc = getAssetEdge(klaytnPoint, bscPoint)
    const klaytnToEth = getAssetEdge(klaytnPoint, ethPoint)
    const klaytnToOArb = getAssetEdge(klaytnPoint, arbPoint)
    const klaytnToOpt = getAssetEdge(klaytnPoint, optPoint)
    const klaytnToBL3 = getAssetEdge(klaytnPoint, bl3Point)

    const bl3ToBsc = getAssetEdge(bl3Point, bscPoint)
    const bl3ToEth = getAssetEdge(bl3Point, ethPoint)
    const bl3ToArb = getAssetEdge(bl3Point, arbPoint)
    const bl3ToOpt = getAssetEdge(bl3Point, optPoint)
    const bl3ToKlaytn = getAssetEdge(bl3Point, klaytnPoint)

    return {
        contracts: [bscContract, ethContract, optContract, arbContract, klaytnContract, bl3Contract],
        connections: [
            //
            // Connections originating from BSC
            //
            bscToEth,
            bscToOpt,
            bscToArb,
            bscToKlaytn,
            bscToBL3,

            //
            // Connections originating from ETH
            //
            ethToBsc,
            ethToOpt,
            ethToArb,
            ethToKlaytn,
            ethToBL3,

            //
            // Connections originating from OPT
            //
            optToBsc,
            optToEth,
            optToArb,
            optToKlaytn,
            optToBL3,

            //
            // Connections originating from ARB
            //
            arbToBsc,
            arbToEth,
            arbToOpt,
            arbToKlaytn,
            arbToBL3,

            //
            // Connections originating from KLAYTN
            //
            klaytnToBsc,
            klaytnToEth,
            klaytnToOArb,
            klaytnToOpt,
            klaytnToBL3,

            //
            // Connections originating from BL3
            //
            bl3ToBsc,
            bl3ToEth,
            bl3ToArb,
            bl3ToOpt,
            bl3ToKlaytn,
        ],
    }
}

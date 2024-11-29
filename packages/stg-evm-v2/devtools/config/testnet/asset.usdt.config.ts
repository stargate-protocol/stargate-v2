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
    const odysseyPoint = getAssetPoint(EndpointId.ODYSSEY_V2_TESTNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLESEP_V2_TESTNET)

    // And all their nodes
    const bscContract = await getAssetNode(bscPoint)
    const ethContract = await getAssetNode(ethPoint)
    const optContract = await getAssetNode(optPoint)
    const arbContract = await getAssetNode(arbPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const bl3Contract = await getAssetNode(bl3Point)
    const odysseyContract = await getAssetNode(odysseyPoint)
    const mantleContract = await getAssetNode(mantlePoint)

    // And all their connections
    const bscToEth = getAssetEdge(bscPoint, ethPoint)
    const bscToOpt = getAssetEdge(bscPoint, optPoint)
    const bscToArb = getAssetEdge(bscPoint, arbPoint)
    const bscToKlaytn = getAssetEdge(bscPoint, klaytnPoint)
    const bscToBL3 = getAssetEdge(bscPoint, bl3Point)
    const bscToOdyssey = getAssetEdge(bscPoint, odysseyPoint)
    const bscToMantle = getAssetEdge(bscPoint, mantlePoint)

    const ethToBsc = getAssetEdge(ethPoint, bscPoint)
    const ethToOpt = getAssetEdge(ethPoint, optPoint)
    const ethToArb = getAssetEdge(ethPoint, arbPoint)
    const ethToKlaytn = getAssetEdge(ethPoint, klaytnPoint)
    const ethToBL3 = getAssetEdge(ethPoint, bl3Point)
    const ethToOdyssey = getAssetEdge(ethPoint, odysseyPoint)
    const ethToMantle = getAssetEdge(ethPoint, mantlePoint)

    const optToBsc = getAssetEdge(optPoint, bscPoint)
    const optToEth = getAssetEdge(optPoint, ethPoint)
    const optToArb = getAssetEdge(optPoint, arbPoint)
    const optToKlaytn = getAssetEdge(optPoint, klaytnPoint)
    const optToBL3 = getAssetEdge(optPoint, bl3Point)
    const optToOdyssey = getAssetEdge(optPoint, odysseyPoint)
    const optToMantle = getAssetEdge(optPoint, mantlePoint)

    const arbToBsc = getAssetEdge(arbPoint, bscPoint)
    const arbToEth = getAssetEdge(arbPoint, ethPoint)
    const arbToOpt = getAssetEdge(arbPoint, optPoint)
    const arbToKlaytn = getAssetEdge(arbPoint, klaytnPoint)
    const arbToBL3 = getAssetEdge(arbPoint, bl3Point)
    const arbToOdyssey = getAssetEdge(arbPoint, odysseyPoint)
    const arbToMantle = getAssetEdge(arbPoint, mantlePoint)

    const klaytnToBsc = getAssetEdge(klaytnPoint, bscPoint)
    const klaytnToEth = getAssetEdge(klaytnPoint, ethPoint)
    const klaytnToOArb = getAssetEdge(klaytnPoint, arbPoint)
    const klaytnToOpt = getAssetEdge(klaytnPoint, optPoint)
    const klaytnToBL3 = getAssetEdge(klaytnPoint, bl3Point)
    const klaytnToOdyssey = getAssetEdge(klaytnPoint, odysseyPoint)
    const klaytnToMantle = getAssetEdge(klaytnPoint, mantlePoint)

    const bl3ToBsc = getAssetEdge(bl3Point, bscPoint)
    const bl3ToEth = getAssetEdge(bl3Point, ethPoint)
    const bl3ToArb = getAssetEdge(bl3Point, arbPoint)
    const bl3ToOpt = getAssetEdge(bl3Point, optPoint)
    const bl3ToKlaytn = getAssetEdge(bl3Point, klaytnPoint)
    const bl3ToOdyssey = getAssetEdge(bl3Point, odysseyPoint)
    const bl3ToMantle = getAssetEdge(bl3Point, mantlePoint)

    const odysseyToBsc = getAssetEdge(odysseyPoint, bscPoint)
    const odysseyToEth = getAssetEdge(odysseyPoint, ethPoint)
    const odysseyToArb = getAssetEdge(odysseyPoint, arbPoint)
    const odysseyToOpt = getAssetEdge(odysseyPoint, optPoint)
    const odysseyToKlaytn = getAssetEdge(odysseyPoint, klaytnPoint)
    const odysseyToBL3 = getAssetEdge(odysseyPoint, bl3Point)

    const mantleToBsc = getAssetEdge(mantlePoint, bscPoint)
    const mantleToEth = getAssetEdge(mantlePoint, ethPoint)
    const mantleToArb = getAssetEdge(mantlePoint, arbPoint)
    const mantleToOpt = getAssetEdge(mantlePoint, optPoint)
    const mantleToKlaytn = getAssetEdge(mantlePoint, klaytnPoint)
    const mantleToBL3 = getAssetEdge(mantlePoint, bl3Point)

    return {
        contracts: [
            bscContract,
            ethContract,
            optContract,
            arbContract,
            klaytnContract,
            bl3Contract,
            odysseyContract,
            mantleContract,
        ],
        connections: [
            //
            // Connections originating from BSC
            //
            bscToEth,
            bscToOpt,
            bscToArb,
            bscToKlaytn,
            bscToBL3,
            bscToOdyssey,
            bscToMantle,

            //
            // Connections originating from ETH
            //
            ethToBsc,
            ethToOpt,
            ethToArb,
            ethToKlaytn,
            ethToBL3,
            ethToOdyssey,
            ethToMantle,

            //
            // Connections originating from OPT
            //
            optToBsc,
            optToEth,
            optToArb,
            optToKlaytn,
            optToBL3,
            optToOdyssey,
            optToMantle,

            //
            // Connections originating from ARB
            //
            arbToBsc,
            arbToEth,
            arbToOpt,
            arbToKlaytn,
            arbToBL3,
            arbToOdyssey,
            arbToMantle,

            //
            // Connections originating from KLAYTN
            //
            klaytnToBsc,
            klaytnToEth,
            klaytnToOArb,
            klaytnToOpt,
            klaytnToBL3,
            klaytnToOdyssey,
            klaytnToMantle,

            //
            // Connections originating from BL3
            //
            bl3ToBsc,
            bl3ToEth,
            bl3ToArb,
            bl3ToOpt,
            bl3ToKlaytn,
            bl3ToOdyssey,
            bl3ToMantle,

            //
            // Connections originating from ODYSSEY
            //
            odysseyToBsc,
            odysseyToEth,
            odysseyToArb,
            odysseyToOpt,
            odysseyToKlaytn,
            odysseyToBL3,

            //
            // Connections originating from MANTLE
            //
            mantleToBsc,
            mantleToEth,
            mantleToArb,
            mantleToOpt,
            mantleToKlaytn,
            mantleToBL3,
        ],
    }
}

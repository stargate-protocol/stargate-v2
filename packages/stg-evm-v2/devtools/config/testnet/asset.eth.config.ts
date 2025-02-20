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
    const ethPoint = getAssetPoint(EndpointId.SEPOLIA_V2_TESTNET)
    const optPoint = getAssetPoint(EndpointId.OPTSEP_V2_TESTNET)
    const arbPoint = getAssetPoint(EndpointId.ARBSEP_V2_TESTNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_TESTNET)
    const bl3Point = getAssetPoint(EndpointId.BL3_V2_TESTNET)
    const odysseyPoint = getAssetPoint(EndpointId.ODYSSEY_V2_TESTNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLESEP_V2_TESTNET)
    const monadPoint = getAssetPoint(EndpointId.MONAD_V2_TESTNET)

    // And all their nodes
    const ethContract = await getAssetNode(ethPoint)
    const optContract = await getAssetNode(optPoint)
    const arbContract = await getAssetNode(arbPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const bl3Contract = await getAssetNode(bl3Point)
    const odysseyContract = await getAssetNode(odysseyPoint)
    const mantleContract = await getAssetNode(mantlePoint)
    const monadContract = await getAssetNode(monadPoint)

    // And all their connections
    const ethToOpt = getAssetEdge(ethPoint, optPoint)
    const ethToArb = getAssetEdge(ethPoint, arbPoint)
    const ethToKlaytn = getAssetEdge(ethPoint, klaytnPoint)
    const ethToBL3 = getAssetEdge(ethPoint, bl3Point)
    const ethToOdyssey = getAssetEdge(ethPoint, odysseyPoint)
    const ethToMantle = getAssetEdge(ethPoint, mantlePoint)
    const ethToMonad = getAssetEdge(ethPoint, monadPoint)

    const optToEth = getAssetEdge(optPoint, ethPoint)
    const optToArb = getAssetEdge(optPoint, arbPoint)
    const optToKlaytn = getAssetEdge(optPoint, klaytnPoint)
    const optToBL3 = getAssetEdge(optPoint, bl3Point)
    const optToOdyssey = getAssetEdge(optPoint, odysseyPoint)
    const optToMantle = getAssetEdge(optPoint, mantlePoint)
    const optToMonad = getAssetEdge(optPoint, monadPoint)

    const arbToEth = getAssetEdge(arbPoint, ethPoint)
    const arbToOpt = getAssetEdge(arbPoint, optPoint)
    const arbToKlaytn = getAssetEdge(arbPoint, klaytnPoint)
    const arbToBL3 = getAssetEdge(arbPoint, bl3Point)
    const arbToOdyssey = getAssetEdge(arbPoint, odysseyPoint)
    const arbToMantle = getAssetEdge(arbPoint, mantlePoint)
    const arbToMonad = getAssetEdge(arbPoint, monadPoint)

    const klaytnToEth = getAssetEdge(klaytnPoint, ethPoint)
    const klaytnToArb = getAssetEdge(klaytnPoint, arbPoint)
    const klaytnToOpt = getAssetEdge(klaytnPoint, optPoint)
    const klaytnToBL3 = getAssetEdge(klaytnPoint, bl3Point)
    const klaytnToOdyssey = getAssetEdge(klaytnPoint, odysseyPoint)
    const klaytnToMantle = getAssetEdge(klaytnPoint, mantlePoint)
    const klaytnToMonad = getAssetEdge(klaytnPoint, monadPoint)

    const bl3ToEth = getAssetEdge(bl3Point, ethPoint)
    const bl3ToArb = getAssetEdge(bl3Point, arbPoint)
    const bl3ToOpt = getAssetEdge(bl3Point, optPoint)
    const bl3ToKlaytn = getAssetEdge(bl3Point, klaytnPoint)
    const bl3ToOdyssey = getAssetEdge(bl3Point, odysseyPoint)
    const bl3ToMantle = getAssetEdge(bl3Point, mantlePoint)
    const bl3ToMonad = getAssetEdge(bl3Point, monadPoint)

    const odysseyToEth = getAssetEdge(odysseyPoint, ethPoint)
    const odysseyToArb = getAssetEdge(odysseyPoint, arbPoint)
    const odysseyToOpt = getAssetEdge(odysseyPoint, optPoint)
    const odysseyToKlaytn = getAssetEdge(odysseyPoint, klaytnPoint)
    const odysseyToBL3 = getAssetEdge(odysseyPoint, bl3Point)
    const odysseyToMantle = getAssetEdge(odysseyPoint, mantlePoint)
    const odysseyToMonad = getAssetEdge(odysseyPoint, monadPoint)

    const mantleToEth = getAssetEdge(mantlePoint, ethPoint)
    const mantleToArb = getAssetEdge(mantlePoint, arbPoint)
    const mantleToOpt = getAssetEdge(mantlePoint, optPoint)
    const mantleToKlaytn = getAssetEdge(mantlePoint, klaytnPoint)
    const mantleToBL3 = getAssetEdge(mantlePoint, bl3Point)
    const mantleToOdyssey = getAssetEdge(mantlePoint, odysseyPoint)
    const mantleToMonad = getAssetEdge(mantlePoint, monadPoint)

    const monadToEth = getAssetEdge(monadPoint, ethPoint)
    const monadToOpt = getAssetEdge(monadPoint, optPoint)
    const monadToArb = getAssetEdge(monadPoint, arbPoint)
    const monadToKlaytn = getAssetEdge(monadPoint, klaytnPoint)
    const monadToBL3 = getAssetEdge(monadPoint, bl3Point)
    const monadToOdyssey = getAssetEdge(monadPoint, odysseyPoint)
    const monadToMantle = getAssetEdge(monadPoint, mantlePoint)

    return {
        contracts: [
            ethContract,
            optContract,
            arbContract,
            klaytnContract,
            bl3Contract,
            odysseyContract,
            mantleContract,
            monadContract,
        ],
        connections: [
            //
            // Connections originating from ETH
            //
            ethToOpt,
            ethToArb,
            ethToKlaytn,
            ethToBL3,
            ethToOdyssey,
            ethToMantle,
            ethToMonad,

            //
            // Connections originating from OPT
            //
            optToEth,
            optToArb,
            optToKlaytn,
            optToBL3,
            optToOdyssey,
            optToMantle,
            optToMonad,

            //
            // Connections originating from ARB
            //
            arbToEth,
            arbToOpt,
            arbToKlaytn,
            arbToBL3,
            arbToOdyssey,
            arbToMantle,
            arbToMonad,

            //
            // Connections originating from KLAYTN
            //
            klaytnToEth,
            klaytnToArb,
            klaytnToOpt,
            klaytnToBL3,
            klaytnToOdyssey,
            klaytnToMantle,
            klaytnToMonad,

            //
            // Connections originating from BL3
            //
            bl3ToEth,
            bl3ToArb,
            bl3ToOpt,
            bl3ToKlaytn,
            bl3ToOdyssey,
            bl3ToMantle,
            bl3ToMonad,

            //
            // Connections originating from ODYSSEY
            //
            odysseyToEth,
            odysseyToArb,
            odysseyToOpt,
            odysseyToKlaytn,
            odysseyToBL3,
            odysseyToMantle,
            odysseyToMonad,

            //
            // Connections originating from MANTLE
            //
            mantleToEth,
            mantleToArb,
            mantleToOpt,
            mantleToKlaytn,
            mantleToBL3,
            mantleToOdyssey,
            mantleToMonad,

            //
            // Connections originating from MONAD
            //
            monadToEth,
            monadToOpt,
            monadToArb,
            monadToKlaytn,
            monadToBL3,
            monadToOdyssey,
            monadToMantle,
        ],
    }
}

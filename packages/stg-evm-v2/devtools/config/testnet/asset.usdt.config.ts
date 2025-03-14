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
    const avalanchePoint = getAssetPoint(EndpointId.AVALANCHE_V2_TESTNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_TESTNET)
    const bl3Point = getAssetPoint(EndpointId.BL3_V2_TESTNET)
    const odysseyPoint = getAssetPoint(EndpointId.ODYSSEY_V2_TESTNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLESEP_V2_TESTNET)
    const monadPoint = getAssetPoint(EndpointId.MONAD_V2_TESTNET)

    // And all their nodes
    const avalancheContract = await getAssetNode(avalanchePoint)
    const bscContract = await getAssetNode(bscPoint)
    const ethContract = await getAssetNode(ethPoint)
    const optContract = await getAssetNode(optPoint)
    const arbContract = await getAssetNode(arbPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const bl3Contract = await getAssetNode(bl3Point)
    const odysseyContract = await getAssetNode(odysseyPoint)
    const mantleContract = await getAssetNode(mantlePoint)
    const monadContract = await getAssetNode(monadPoint)

    // And all their connections
    const bscToEth = getAssetEdge(bscPoint, ethPoint)
    const bscToOpt = getAssetEdge(bscPoint, optPoint)
    const bscToArb = getAssetEdge(bscPoint, arbPoint)
    const bscToAvalanche = getAssetEdge(bscPoint, avalanchePoint)
    const bscToKlaytn = getAssetEdge(bscPoint, klaytnPoint)
    const bscToBL3 = getAssetEdge(bscPoint, bl3Point)
    const bscToOdyssey = getAssetEdge(bscPoint, odysseyPoint)
    const bscToMantle = getAssetEdge(bscPoint, mantlePoint)
    const bscToMonad = getAssetEdge(bscPoint, monadPoint)

    const ethToBsc = getAssetEdge(ethPoint, bscPoint)
    const ethToOpt = getAssetEdge(ethPoint, optPoint)
    const ethToArb = getAssetEdge(ethPoint, arbPoint)
    const ethToAvalanche = getAssetEdge(ethPoint, avalanchePoint)
    const ethToKlaytn = getAssetEdge(ethPoint, klaytnPoint)
    const ethToBL3 = getAssetEdge(ethPoint, bl3Point)
    const ethToOdyssey = getAssetEdge(ethPoint, odysseyPoint)
    const ethToMantle = getAssetEdge(ethPoint, mantlePoint)
    const ethToMonad = getAssetEdge(ethPoint, monadPoint)

    const optToBsc = getAssetEdge(optPoint, bscPoint)
    const optToEth = getAssetEdge(optPoint, ethPoint)
    const optToArb = getAssetEdge(optPoint, arbPoint)
    const optToAvalanche = getAssetEdge(optPoint, avalanchePoint)
    const optToKlaytn = getAssetEdge(optPoint, klaytnPoint)
    const optToBL3 = getAssetEdge(optPoint, bl3Point)
    const optToOdyssey = getAssetEdge(optPoint, odysseyPoint)
    const optToMantle = getAssetEdge(optPoint, mantlePoint)
    const optToMonad = getAssetEdge(optPoint, monadPoint)

    const arbToBsc = getAssetEdge(arbPoint, bscPoint)
    const arbToEth = getAssetEdge(arbPoint, ethPoint)
    const arbToOpt = getAssetEdge(arbPoint, optPoint)
    const arbToAvalanche = getAssetEdge(arbPoint, avalanchePoint)
    const arbToKlaytn = getAssetEdge(arbPoint, klaytnPoint)
    const arbToBL3 = getAssetEdge(arbPoint, bl3Point)
    const arbToOdyssey = getAssetEdge(arbPoint, odysseyPoint)
    const arbToMantle = getAssetEdge(arbPoint, mantlePoint)
    const arbToMonad = getAssetEdge(arbPoint, monadPoint)

    const klaytnToBsc = getAssetEdge(klaytnPoint, bscPoint)
    const klaytnToEth = getAssetEdge(klaytnPoint, ethPoint)
    const klaytnToOArb = getAssetEdge(klaytnPoint, arbPoint)
    const klaytnToAvalanche = getAssetEdge(klaytnPoint, avalanchePoint)
    const klaytnToOpt = getAssetEdge(klaytnPoint, optPoint)
    const klaytnToBL3 = getAssetEdge(klaytnPoint, bl3Point)
    const klaytnToOdyssey = getAssetEdge(klaytnPoint, odysseyPoint)
    const klaytnToMantle = getAssetEdge(klaytnPoint, mantlePoint)
    const klaytnToMonad = getAssetEdge(klaytnPoint, monadPoint)

    const bl3ToBsc = getAssetEdge(bl3Point, bscPoint)
    const bl3ToEth = getAssetEdge(bl3Point, ethPoint)
    const bl3ToArb = getAssetEdge(bl3Point, arbPoint)
    const bl3ToAvalanche = getAssetEdge(bl3Point, avalanchePoint)
    const bl3ToOpt = getAssetEdge(bl3Point, optPoint)
    const bl3ToKlaytn = getAssetEdge(bl3Point, klaytnPoint)
    const bl3ToOdyssey = getAssetEdge(bl3Point, odysseyPoint)
    const bl3ToMantle = getAssetEdge(bl3Point, mantlePoint)
    const bl3ToMonad = getAssetEdge(bl3Point, monadPoint)

    const odysseyToBsc = getAssetEdge(odysseyPoint, bscPoint)
    const odysseyToEth = getAssetEdge(odysseyPoint, ethPoint)
    const odysseyToArb = getAssetEdge(odysseyPoint, arbPoint)
    const odysseyToAvalanche = getAssetEdge(odysseyPoint, avalanchePoint)
    const odysseyToOpt = getAssetEdge(odysseyPoint, optPoint)
    const odysseyToKlaytn = getAssetEdge(odysseyPoint, klaytnPoint)
    const odysseyToBL3 = getAssetEdge(odysseyPoint, bl3Point)
    const odysseyToMantle = getAssetEdge(odysseyPoint, mantlePoint)
    const odysseyToMonad = getAssetEdge(odysseyPoint, monadPoint)

    const mantleToBsc = getAssetEdge(mantlePoint, bscPoint)
    const mantleToEth = getAssetEdge(mantlePoint, ethPoint)
    const mantleToArb = getAssetEdge(mantlePoint, arbPoint)
    const mantleToAvalanche = getAssetEdge(mantlePoint, avalanchePoint)
    const mantleToOpt = getAssetEdge(mantlePoint, optPoint)
    const mantleToKlaytn = getAssetEdge(mantlePoint, klaytnPoint)
    const mantleToBL3 = getAssetEdge(mantlePoint, bl3Point)
    const mantleToOdyssey = getAssetEdge(mantlePoint, odysseyPoint)
    const mantleToMonad = getAssetEdge(mantlePoint, monadPoint)

    const monadToBsc = getAssetEdge(monadPoint, bscPoint)
    const monadToEth = getAssetEdge(monadPoint, ethPoint)
    const monadToOpt = getAssetEdge(monadPoint, optPoint)
    const monadToArb = getAssetEdge(monadPoint, arbPoint)
    const monadToKlaytn = getAssetEdge(monadPoint, klaytnPoint)
    const monadToBL3 = getAssetEdge(monadPoint, bl3Point)
    const monadToOdyssey = getAssetEdge(monadPoint, odysseyPoint)
    const monadToMantle = getAssetEdge(monadPoint, mantlePoint)

    const avalancheToBsc = getAssetEdge(avalanchePoint, bscPoint)
    const avalancheToEth = getAssetEdge(avalanchePoint, ethPoint)
    const avalancheToOpt = getAssetEdge(avalanchePoint, optPoint)
    const avalancheToArb = getAssetEdge(avalanchePoint, arbPoint)
    const avalancheToKlaytn = getAssetEdge(avalanchePoint, klaytnPoint)
    const avalancheToBL3 = getAssetEdge(avalanchePoint, bl3Point)
    const avalancheToOdyssey = getAssetEdge(avalanchePoint, odysseyPoint)
    const avalancheToMantle = getAssetEdge(avalanchePoint, mantlePoint)

    return {
        contracts: [
            bscContract,
            ethContract,
            optContract,
            arbContract,
            avalancheContract,
            klaytnContract,
            bl3Contract,
            odysseyContract,
            mantleContract,
            monadContract,
        ],
        connections: [
            //
            // Connections originating from BSC
            //
            bscToEth,
            bscToOpt,
            bscToArb,
            bscToAvalanche,
            bscToKlaytn,
            bscToBL3,
            bscToOdyssey,
            bscToMantle,
            bscToMonad,

            //
            // Connections originating from ETH
            //
            ethToBsc,
            ethToOpt,
            ethToArb,
            ethToAvalanche,
            ethToKlaytn,
            ethToBL3,
            ethToOdyssey,
            ethToMantle,
            ethToMonad,

            //
            // Connections originating from OPT
            //
            optToBsc,
            optToEth,
            optToArb,
            optToAvalanche,
            optToKlaytn,
            optToBL3,
            optToOdyssey,
            optToMantle,
            optToMonad,

            //
            // Connections originating from ARB
            //
            arbToBsc,
            arbToEth,
            arbToOpt,
            arbToAvalanche,
            arbToKlaytn,
            arbToBL3,
            arbToOdyssey,
            arbToMantle,
            arbToMonad,

            //
            // Connections originating from AVALANCHE
            //
            avalancheToBsc,
            avalancheToEth,
            avalancheToOpt,
            avalancheToArb,
            avalancheToKlaytn,
            avalancheToBL3,
            avalancheToOdyssey,
            avalancheToMantle,

            //
            // Connections originating from KLAYTN
            //
            klaytnToBsc,
            klaytnToEth,
            klaytnToOArb,
            klaytnToAvalanche,
            klaytnToOpt,
            klaytnToBL3,
            klaytnToOdyssey,
            klaytnToMantle,
            klaytnToMonad,

            //
            // Connections originating from BL3
            //
            bl3ToBsc,
            bl3ToEth,
            bl3ToArb,
            bl3ToAvalanche,
            bl3ToOpt,
            bl3ToKlaytn,
            bl3ToOdyssey,
            bl3ToMantle,
            bl3ToMonad,

            //
            // Connections originating from ODYSSEY
            //
            odysseyToBsc,
            odysseyToEth,
            odysseyToArb,
            odysseyToAvalanche,
            odysseyToOpt,
            odysseyToKlaytn,
            odysseyToBL3,
            odysseyToMantle,
            odysseyToMonad,

            //
            // Connections originating from MANTLE
            //
            mantleToBsc,
            mantleToEth,
            mantleToArb,
            mantleToAvalanche,
            mantleToOpt,
            mantleToKlaytn,
            mantleToBL3,
            mantleToOdyssey,
            mantleToMonad,

            //
            // Connections originating from MONAD
            //
            monadToBsc,
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

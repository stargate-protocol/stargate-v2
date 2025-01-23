import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../utils'
import { generateAssetConfig } from '../../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.USDC

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // Now we define all the contracts
    const abstractPoint = getAssetPoint(EndpointId.ABSTRACT_V2_MAINNET)
    const arbPoint = getAssetPoint(EndpointId.ARBITRUM_V2_MAINNET)
    const auroraPoint = getAssetPoint(EndpointId.AURORA_V2_MAINNET)
    const avaxPoint = getAssetPoint(EndpointId.AVALANCHE_V2_MAINNET)
    const basePoint = getAssetPoint(EndpointId.BASE_V2_MAINNET)
    const beraPoint = getAssetPoint(EndpointId.BERA_V2_MAINNET)
    const bscPoint = getAssetPoint(EndpointId.BSC_V2_MAINNET)
    const codexPoint = getAssetPoint(EndpointId.CODEX_V2_MAINNET)
    const coredaoPoint = getAssetPoint(EndpointId.COREDAO_V2_MAINNET)
    const degenPoint = getAssetPoint(EndpointId.DEGEN_V2_MAINNET)
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)
    const flarePoint = getAssetPoint(EndpointId.FLARE_V2_MAINNET)
    const fusePoint = getAssetPoint(EndpointId.FUSE_V2_MAINNET)
    const gluePoint = getAssetPoint(EndpointId.GLUE_V2_MAINNET)
    const gravityPoint = getAssetPoint(EndpointId.GRAVITY_V2_MAINNET)
    const hemiPoint = getAssetPoint(EndpointId.HEMI_V2_MAINNET)
    const inkPoint = getAssetPoint(EndpointId.INK_V2_MAINNET)
    const iotaPoint = getAssetPoint(EndpointId.IOTA_V2_MAINNET)
    const islanderPoint = getAssetPoint(EndpointId.ISLANDER_V2_MAINNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_MAINNET)
    const lightlinkPoint = getAssetPoint(EndpointId.LIGHTLINK_V2_MAINNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLE_V2_MAINNET)
    const optPoint = getAssetPoint(EndpointId.OPTIMISM_V2_MAINNET)
    const peaqPoint = getAssetPoint(EndpointId.PEAQ_V2_MAINNET)
    const plumePoint = getAssetPoint(EndpointId.PLUME_V2_MAINNET)
    const polygonPoint = getAssetPoint(EndpointId.POLYGON_V2_MAINNET)
    const rariblePoint = getAssetPoint(EndpointId.RARIBLE_V2_MAINNET)
    const rootstockPoint = getAssetPoint(EndpointId.ROOTSTOCK_V2_MAINNET)
    const scrollPoint = getAssetPoint(EndpointId.SCROLL_V2_MAINNET)
    const seiPoint = getAssetPoint(EndpointId.SEI_V2_MAINNET)
    const soneiumPoint = getAssetPoint(EndpointId.SONEIUM_V2_MAINNET)
    const superpositionPoint = getAssetPoint(EndpointId.SUPERPOSITION_V2_MAINNET)
    const taikoPoint = getAssetPoint(EndpointId.TAIKO_V2_MAINNET)
    const xchainPoint = getAssetPoint(EndpointId.XCHAIN_V2_MAINNET)

    // And all their nodes
    const abstractContract = await getAssetNode(abstractPoint)
    const arbContract = await getAssetNode(arbPoint)
    const auroraContract = await getAssetNode(auroraPoint)
    const avaxContract = await getAssetNode(avaxPoint)
    const baseContract = await getAssetNode(basePoint)
    const beraContract = await getAssetNode(beraPoint)
    const bscContract = await getAssetNode(bscPoint)
    const codexContract = await getAssetNode(codexPoint)
    const coredaoContract = await getAssetNode(coredaoPoint)
    const degenContract = await getAssetNode(degenPoint)
    const ethContract = await getAssetNode(ethPoint)
    const flareContract = await getAssetNode(flarePoint)
    const fuseContract = await getAssetNode(fusePoint)
    const glueContract = await getAssetNode(gluePoint)
    const gravityContract = await getAssetNode(gravityPoint)
    const hemiContract = await getAssetNode(hemiPoint)
    const inkContract = await getAssetNode(inkPoint)
    const iotaContract = await getAssetNode(iotaPoint)
    const islanderContract = await getAssetNode(islanderPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const lightlinkContract = await getAssetNode(lightlinkPoint)
    const mantleContract = await getAssetNode(mantlePoint)
    const optContract = await getAssetNode(optPoint)
    const peaqContract = await getAssetNode(peaqPoint)
    const plumeContract = await getAssetNode(plumePoint)
    const polygonContract = await getAssetNode(polygonPoint)
    const raribleContract = await getAssetNode(rariblePoint)
    const rootstockContract = await getAssetNode(rootstockPoint)
    const scrollContract = await getAssetNode(scrollPoint)
    const seiContract = await getAssetNode(seiPoint)
    const soneiumContract = await getAssetNode(soneiumPoint)
    const superpositionContract = await getAssetNode(superpositionPoint)
    const taikoContract = await getAssetNode(taikoPoint)
    const xchainContract = await getAssetNode(xchainPoint)

    return {
        contracts: [
            abstractContract,
            arbContract,
            auroraContract,
            avaxContract,
            baseContract,
            beraContract,
            bscContract,
            codexContract,
            coredaoContract,
            degenContract,
            ethContract,
            flareContract,
            fuseContract,
            glueContract,
            gravityContract,
            hemiContract,
            inkContract,
            iotaContract,
            islanderContract,
            klaytnContract,
            lightlinkContract,
            mantleContract,
            optContract,
            peaqContract,
            plumeContract,
            polygonContract,
            raribleContract,
            rootstockContract,
            scrollContract,
            seiContract,
            soneiumContract,
            superpositionContract,
            taikoContract,
            xchainContract,
        ],
        connections: generateAssetConfig(tokenName, [
            abstractPoint,
            arbPoint,
            auroraPoint,
            avaxPoint,
            basePoint,
            beraPoint,
            bscPoint,
            codexPoint,
            coredaoPoint,
            degenPoint,
            ethPoint,
            flarePoint,
            fusePoint,
            gluePoint,
            gravityPoint,
            hemiPoint,
            inkPoint,
            iotaPoint,
            islanderPoint,
            klaytnPoint,
            lightlinkPoint,
            mantlePoint,
            optPoint,
            peaqPoint,
            plumePoint,
            polygonPoint,
            rariblePoint,
            rootstockPoint,
            scrollPoint,
            seiPoint,
            soneiumPoint,
            superpositionPoint,
            taikoPoint,
            xchainPoint,
        ]),
    }
}

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../utils'
import { generateAssetConfig } from '../../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.USDT

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // Now we define all the contracts
    const abstractPoint = getAssetPoint(EndpointId.ABSTRACT_V2_MAINNET)
    const apePoint = getAssetPoint(EndpointId.APE_V2_MAINNET)
    const arbPoint = getAssetPoint(EndpointId.ARBITRUM_V2_MAINNET)
    const avaxPoint = getAssetPoint(EndpointId.AVALANCHE_V2_MAINNET)
    const bscPoint = getAssetPoint(EndpointId.BSC_V2_MAINNET)
    const coredaoPoint = getAssetPoint(EndpointId.COREDAO_V2_MAINNET)
    const degenPoint = getAssetPoint(EndpointId.DEGEN_V2_MAINNET)
    const ebiPoint = getAssetPoint(EndpointId.EBI_V2_MAINNET)
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)
    const flarePoint = getAssetPoint(EndpointId.FLARE_V2_MAINNET)
    const flowPoint = getAssetPoint(EndpointId.FLOW_V2_MAINNET)
    const fusePoint = getAssetPoint(EndpointId.FUSE_V2_MAINNET)
    const gluePoint = getAssetPoint(EndpointId.GLUE_V2_MAINNET)
    const goatPoint = getAssetPoint(EndpointId.GOAT_V2_MAINNET)
    const gravityPoint = getAssetPoint(EndpointId.GRAVITY_V2_MAINNET)
    const hemiPoint = getAssetPoint(EndpointId.HEMI_V2_MAINNET)
    const iotaPoint = getAssetPoint(EndpointId.IOTA_V2_MAINNET)
    const islanderPoint = getAssetPoint(EndpointId.ISLANDER_V2_MAINNET)
    const kavaPoint = getAssetPoint(EndpointId.KAVA_V2_MAINNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_MAINNET)
    const lightlinkPoint = getAssetPoint(EndpointId.LIGHTLINK_V2_MAINNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLE_V2_MAINNET)
    const metisPoint = getAssetPoint(EndpointId.METIS_V2_MAINNET)
    const optPoint = getAssetPoint(EndpointId.OPTIMISM_V2_MAINNET)
    const peaqPoint = getAssetPoint(EndpointId.PEAQ_V2_MAINNET)
    const plumePoint = getAssetPoint(EndpointId.PLUME_V2_MAINNET)
    const polygonPoint = getAssetPoint(EndpointId.POLYGON_V2_MAINNET)
    const rariblePoint = getAssetPoint(EndpointId.RARIBLE_V2_MAINNET)
    const rootstockPoint = getAssetPoint(EndpointId.ROOTSTOCK_V2_MAINNET)
    const seiPoint = getAssetPoint(EndpointId.SEI_V2_MAINNET)
    const storyPoint = getAssetPoint(EndpointId.STORY_V2_MAINNET)
    const taikoPoint = getAssetPoint(EndpointId.TAIKO_V2_MAINNET)
    const telosPoint = getAssetPoint(EndpointId.TELOS_V2_MAINNET)

    // And all their nodes
    const abstractContract = await getAssetNode(abstractPoint)
    const apeContract = await getAssetNode(apePoint)
    const arbContract = await getAssetNode(arbPoint)
    const avaxContract = await getAssetNode(avaxPoint)
    const bscContract = await getAssetNode(bscPoint)
    const coredaoContract = await getAssetNode(coredaoPoint)
    const degenContract = await getAssetNode(degenPoint)
    const ebiContract = await getAssetNode(ebiPoint)
    const ethContract = await getAssetNode(ethPoint)
    const flareContract = await getAssetNode(flarePoint)
    const flowContract = await getAssetNode(flowPoint)
    const fuseContract = await getAssetNode(fusePoint)
    const glueContract = await getAssetNode(gluePoint)
    const goatContract = await getAssetNode(goatPoint)
    const gravityContract = await getAssetNode(gravityPoint)
    const hemiContract = await getAssetNode(hemiPoint)
    const iotaContract = await getAssetNode(iotaPoint)
    const islanderContract = await getAssetNode(islanderPoint)
    const kavaContract = await getAssetNode(kavaPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const lightlinkContract = await getAssetNode(lightlinkPoint)
    const mantleContract = await getAssetNode(mantlePoint)
    const metisContract = await getAssetNode(metisPoint)
    const optContract = await getAssetNode(optPoint)
    const peaqContract = await getAssetNode(peaqPoint)
    const plumeContract = await getAssetNode(plumePoint)
    const polygonContract = await getAssetNode(polygonPoint)
    const raribleContract = await getAssetNode(rariblePoint)
    const rootstockContract = await getAssetNode(rootstockPoint)
    const seiContract = await getAssetNode(seiPoint)
    const storyContract = await getAssetNode(storyPoint)
    const taikoContract = await getAssetNode(taikoPoint)
    const telosContract = await getAssetNode(telosPoint)

    return {
        contracts: [
            abstractContract,
            apeContract,
            arbContract,
            avaxContract,
            bscContract,
            coredaoContract,
            degenContract,
            ebiContract,
            ethContract,
            flareContract,
            flowContract,
            fuseContract,
            glueContract,
            goatContract,
            gravityContract,
            hemiContract,
            iotaContract,
            islanderContract,
            kavaContract,
            klaytnContract,
            lightlinkContract,
            mantleContract,
            metisContract,
            optContract,
            peaqContract,
            plumeContract,
            polygonContract,
            raribleContract,
            rootstockContract,
            seiContract,
            storyContract,
            taikoContract,
            telosContract,
        ],
        connections: generateAssetConfig(tokenName, [
            abstractPoint,
            apePoint,
            arbPoint,
            avaxPoint,
            bscPoint,
            coredaoPoint,
            degenPoint,
            ebiPoint,
            ethPoint,
            flarePoint,
            flowPoint,
            fusePoint,
            gluePoint,
            goatPoint,
            gravityPoint,
            hemiPoint,
            iotaPoint,
            islanderPoint,
            kavaPoint,
            klaytnPoint,
            lightlinkPoint,
            mantlePoint,
            metisPoint,
            optPoint,
            peaqPoint,
            plumePoint,
            polygonPoint,
            rariblePoint,
            rootstockPoint,
            seiPoint,
            storyPoint,
            taikoPoint,
            telosPoint,
        ]),
    }
}

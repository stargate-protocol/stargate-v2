import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../utils'
import { generateAssetConfig } from '../../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.ETH

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // Now we define all the contracts
    const abstractPoint = getAssetPoint(EndpointId.ABSTRACT_V2_MAINNET)
    const apePoint = getAssetPoint(EndpointId.APE_V2_MAINNET)
    const arbPoint = getAssetPoint(EndpointId.ARBITRUM_V2_MAINNET)
    const basePoint = getAssetPoint(EndpointId.BASE_V2_MAINNET)
    const beraPoint = getAssetPoint(EndpointId.BERA_V2_MAINNET)
    const degenPoint = getAssetPoint(EndpointId.DEGEN_V2_MAINNET)
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)
    const flarePoint = getAssetPoint(EndpointId.FLARE_V2_MAINNET)
    const flowPoint = getAssetPoint(EndpointId.FLOW_V2_MAINNET)
    const fusePoint = getAssetPoint(EndpointId.FUSE_V2_MAINNET)
    const gluePoint = getAssetPoint(EndpointId.GLUE_V2_MAINNET)
    const gnosisPoint = getAssetPoint(EndpointId.GNOSIS_V2_MAINNET)
    const goatPoint = getAssetPoint(EndpointId.GOAT_V2_MAINNET)
    const gravityPoint = getAssetPoint(EndpointId.GRAVITY_V2_MAINNET)
    const hemiPoint = getAssetPoint(EndpointId.HEMI_V2_MAINNET)
    const iotaPoint = getAssetPoint(EndpointId.IOTA_V2_MAINNET)
    const islanderPoint = getAssetPoint(EndpointId.ISLANDER_V2_MAINNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_MAINNET)
    const lightlinkPoint = getAssetPoint(EndpointId.LIGHTLINK_V2_MAINNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLE_V2_MAINNET)
    const metisPoint = getAssetPoint(EndpointId.METIS_V2_MAINNET)
    const optPoint = getAssetPoint(EndpointId.OPTIMISM_V2_MAINNET)
    const peaqPoint = getAssetPoint(EndpointId.PEAQ_V2_MAINNET)
    const rootstockPoint = getAssetPoint(EndpointId.ROOTSTOCK_V2_MAINNET)
    const scrollPoint = getAssetPoint(EndpointId.SCROLL_V2_MAINNET)
    const seiPoint = getAssetPoint(EndpointId.SEI_V2_MAINNET)
    const soneiumPoint = getAssetPoint(EndpointId.SONEIUM_V2_MAINNET)
    const storyPoint = getAssetPoint(EndpointId.STORY_V2_MAINNET)
    const unichainPoint = getAssetPoint(EndpointId.UNICHAIN_V2_MAINNET)
    const zkConsensysPoint = getAssetPoint(EndpointId.ZKCONSENSYS_V2_MAINNET)

    // And all their nodes
    const abstractContract = await getAssetNode(abstractPoint)
    const apeContract = await getAssetNode(apePoint)
    const arbContract = await getAssetNode(arbPoint)
    const baseContract = await getAssetNode(basePoint)
    const beraContract = await getAssetNode(beraPoint)
    const degenContract = await getAssetNode(degenPoint)
    const ethContract = await getAssetNode(ethPoint)
    const flareContract = await getAssetNode(flarePoint)
    const flowContract = await getAssetNode(flowPoint)
    const fuseContract = await getAssetNode(fusePoint)
    const glueContract = await getAssetNode(gluePoint)
    const gnosisContract = await getAssetNode(gnosisPoint)
    const goatContract = await getAssetNode(goatPoint)
    const gravityContract = await getAssetNode(gravityPoint)
    const hemiContract = await getAssetNode(hemiPoint)
    const iotaContract = await getAssetNode(iotaPoint)
    const islanderContract = await getAssetNode(islanderPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const lightlinkContract = await getAssetNode(lightlinkPoint)
    const mantleContract = await getAssetNode(mantlePoint)
    const metisContract = await getAssetNode(metisPoint)
    const optContract = await getAssetNode(optPoint)
    const peaqContract = await getAssetNode(peaqPoint)
    const rootstockContract = await getAssetNode(rootstockPoint)
    const scrollContract = await getAssetNode(scrollPoint)
    const seiContract = await getAssetNode(seiPoint)
    const soneiumContract = await getAssetNode(soneiumPoint)
    const storyContract = await getAssetNode(storyPoint)
    const unichainContract = await getAssetNode(unichainPoint)
    const zkConsensysContract = await getAssetNode(zkConsensysPoint)

    return {
        contracts: [
            abstractContract,
            apeContract,
            arbContract,
            ethContract,
            baseContract,
            beraContract,
            degenContract,
            flareContract,
            flowContract,
            fuseContract,
            glueContract,
            gnosisContract,
            goatContract,
            gravityContract,
            hemiContract,
            iotaContract,
            islanderContract,
            klaytnContract,
            lightlinkContract,
            mantleContract,
            metisContract,
            optContract,
            peaqContract,
            rootstockContract,
            scrollContract,
            seiContract,
            soneiumContract,
            storyContract,
            unichainContract,
            zkConsensysContract,
        ],
        connections: generateAssetConfig(tokenName, [
            abstractPoint,
            apePoint,
            arbPoint,
            ethPoint,
            basePoint,
            beraPoint,
            degenPoint,
            iotaPoint,
            islanderPoint,
            flarePoint,
            flowPoint,
            fusePoint,
            gluePoint,
            gnosisPoint,
            goatPoint,
            gravityPoint,
            hemiPoint,
            klaytnPoint,
            lightlinkPoint,
            mantlePoint,
            metisPoint,
            optPoint,
            peaqPoint,
            rootstockPoint,
            scrollPoint,
            seiPoint,
            soneiumPoint,
            storyPoint,
            unichainPoint,
            zkConsensysPoint,
        ]),
    }
}

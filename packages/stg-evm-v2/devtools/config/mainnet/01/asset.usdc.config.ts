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
    const arbPoint = getAssetPoint(EndpointId.ARBITRUM_V2_MAINNET)
    const auroraPoint = getAssetPoint(EndpointId.AURORA_V2_MAINNET)
    const avaxPoint = getAssetPoint(EndpointId.AVALANCHE_V2_MAINNET)
    const basePoint = getAssetPoint(EndpointId.BASE_V2_MAINNET)
    const bscPoint = getAssetPoint(EndpointId.BSC_V2_MAINNET)
    const codexPoint = getAssetPoint(EndpointId.CODEX_V2_MAINNET)
    const coredaoPoint = getAssetPoint(EndpointId.COREDAO_V2_MAINNET)
    const degenPoint = getAssetPoint(EndpointId.DEGEN_V2_MAINNET)
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)
    const flarePoint = getAssetPoint(EndpointId.FLARE_V2_MAINNET)
    const gravityPoint = getAssetPoint(EndpointId.GRAVITY_V2_MAINNET)
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
    const scrollPoint = getAssetPoint(EndpointId.SCROLL_V2_MAINNET)
    const seiPoint = getAssetPoint(EndpointId.SEI_V2_MAINNET)
    const superpositionPoint = getAssetPoint(EndpointId.SUPERPOSITION_V2_MAINNET)
    const taikoPoint = getAssetPoint(EndpointId.TAIKO_V2_MAINNET)
    const xchainPoint = getAssetPoint(EndpointId.XCHAIN_V2_MAINNET)

    // And all their nodes
    const arbContract = await getAssetNode(arbPoint)
    const auroraContract = await getAssetNode(auroraPoint)
    const avaxContract = await getAssetNode(avaxPoint)
    const baseContract = await getAssetNode(basePoint)
    const bscContract = await getAssetNode(bscPoint)
    const codexContract = await getAssetNode(codexPoint)
    const coredaoContract = await getAssetNode(coredaoPoint)
    const degenContract = await getAssetNode(degenPoint)
    const ethContract = await getAssetNode(ethPoint)
    const flareContract = await getAssetNode(flarePoint)
    const gravityContract = await getAssetNode(gravityPoint)
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
    const scrollContract = await getAssetNode(scrollPoint)
    const seiContract = await getAssetNode(seiPoint)
    const superpositionContract = await getAssetNode(superpositionPoint)
    const taikoContract = await getAssetNode(taikoPoint)
    const xchainContract = await getAssetNode(xchainPoint)

    return {
        contracts: [
            arbContract,
            auroraContract,
            avaxContract,
            baseContract,
            bscContract,
            codexContract,
            coredaoContract,
            degenContract,
            ethContract,
            flareContract,
            gravityContract,
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
            scrollContract,
            seiContract,
            superpositionContract,
            taikoContract,
            xchainContract,
        ],
        connections: generateAssetConfig(tokenName, [
            arbPoint,
            auroraPoint,
            avaxPoint,
            basePoint,
            bscPoint,
            codexPoint,
            coredaoPoint,
            degenPoint,
            ethPoint,
            flarePoint,
            gravityPoint,
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
            scrollPoint,
            seiPoint,
            superpositionPoint,
            taikoPoint,
            xchainPoint,
        ]),
    }
}

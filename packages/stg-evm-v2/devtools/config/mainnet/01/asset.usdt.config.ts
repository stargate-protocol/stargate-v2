import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../src/asset/utils'
import { generateAssetConfig } from '../../utils'

import { DEFAULT_PLANNER } from './constants'

import type { AssetEdgeConfig, AssetNodeConfig } from '../../../src/asset'

const tokenName = TokenName.USDT

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // Now we define all the contracts
    const arbPoint = getAssetPoint(EndpointId.ARBITRUM_V2_MAINNET)
    const avaxPoint = getAssetPoint(EndpointId.AVALANCHE_V2_MAINNET)
    const bscPoint = getAssetPoint(EndpointId.BSC_V2_MAINNET)
    const ebiPoint = getAssetPoint(EndpointId.EBI_V2_MAINNET)
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)
    const iotaPoint = getAssetPoint(EndpointId.IOTA_V2_MAINNET)
    const kavaPoint = getAssetPoint(EndpointId.KAVA_V2_MAINNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_MAINNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLE_V2_MAINNET)
    const metisPoint = getAssetPoint(EndpointId.METIS_V2_MAINNET)
    const optPoint = getAssetPoint(EndpointId.OPTIMISM_V2_MAINNET)
    const polygonPoint = getAssetPoint(EndpointId.POLYGON_V2_MAINNET)
    const rariblePoint = getAssetPoint(EndpointId.RARIBLE_V2_MAINNET)
    const taikoPoint = getAssetPoint(EndpointId.TAIKO_V2_MAINNET)

    // And all their nodes
    const arbContract = await getAssetNode(arbPoint)
    const avaxContract = await getAssetNode(avaxPoint)
    const ebiContract = await getAssetNode(ebiPoint)
    const ethContract = await getAssetNode(ethPoint)
    const bscContract = await getAssetNode(bscPoint)
    const iotaContract = await getAssetNode(iotaPoint)
    const kavaContract = await getAssetNode(kavaPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const mantleContract = await getAssetNode(mantlePoint)
    const metisContract = await getAssetNode(metisPoint)
    const optContract = await getAssetNode(optPoint)
    const polygonContract = await getAssetNode(polygonPoint)
    const raribleContract = await getAssetNode(rariblePoint)
    const taikoContract = await getAssetNode(taikoPoint)

    return {
        contracts: [
            arbContract,
            avaxContract,
            ebiContract,
            ethContract,
            bscContract,
            iotaContract,
            kavaContract,
            klaytnContract,
            mantleContract,
            metisContract,
            optContract,
            polygonContract,
            raribleContract,
            taikoContract,
        ],
        connections: generateAssetConfig(tokenName, [
            arbPoint,
            avaxPoint,
            ebiPoint,
            ethPoint,
            bscPoint,
            iotaPoint,
            kavaPoint,
            klaytnPoint,
            mantlePoint,
            metisPoint,
            optPoint,
            polygonPoint,
            rariblePoint,
            taikoPoint,
        ]),
    }
}

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
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)
    const gravityPoint = getAssetPoint(EndpointId.GRAVITY_V2_MAINNET)
    const iotaPoint = getAssetPoint(EndpointId.IOTA_V2_MAINNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_MAINNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLE_V2_MAINNET)
    const optPoint = getAssetPoint(EndpointId.OPTIMISM_V2_MAINNET)
    const polygonPoint = getAssetPoint(EndpointId.POLYGON_V2_MAINNET)
    const rariblePoint = getAssetPoint(EndpointId.RARIBLE_V2_MAINNET)
    const scrollPoint = getAssetPoint(EndpointId.SCROLL_V2_MAINNET)
    const taikoPoint = getAssetPoint(EndpointId.TAIKO_V2_MAINNET)
    const xchainPoint = getAssetPoint(EndpointId.XCHAIN_V2_MAINNET)

    // And all their nodes
    const arbContract = await getAssetNode(arbPoint)
    const auroraContract = await getAssetNode(auroraPoint)
    const avaxContract = await getAssetNode(avaxPoint)
    const baseContract = await getAssetNode(basePoint)
    const ethContract = await getAssetNode(ethPoint)
    const gravityContract = await getAssetNode(gravityPoint)
    const iotaContract = await getAssetNode(iotaPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const mantleContract = await getAssetNode(mantlePoint)
    const optContract = await getAssetNode(optPoint)
    const polygonContract = await getAssetNode(polygonPoint)
    const raribleContract = await getAssetNode(rariblePoint)
    const scrollContract = await getAssetNode(scrollPoint)
    const taikoContract = await getAssetNode(taikoPoint)
    const xchainContract = await getAssetNode(xchainPoint)

    return {
        contracts: [
            arbContract,
            auroraContract,
            avaxContract,
            baseContract,
            ethContract,
            gravityContract,
            iotaContract,
            klaytnContract,
            mantleContract,
            optContract,
            polygonContract,
            raribleContract,
            scrollContract,
            taikoContract,
            xchainContract,
        ],
        connections: generateAssetConfig(tokenName, [
            arbPoint,
            auroraPoint,
            avaxPoint,
            basePoint,
            ethPoint,
            gravityPoint,
            iotaPoint,
            klaytnPoint,
            mantlePoint,
            optPoint,
            polygonPoint,
            rariblePoint,
            scrollPoint,
            taikoPoint,
            xchainPoint,
        ]),
    }
}

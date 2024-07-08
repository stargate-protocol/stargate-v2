import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../src/asset/utils'
import { generateAssetConfig } from '../../utils'

import { DEFAULT_PLANNER } from './constants'

import type { AssetEdgeConfig, AssetNodeConfig } from '../../../src/asset'

const tokenName = TokenName.ETH

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // Now we define all the contracts
    const arbPoint = getAssetPoint(EndpointId.ARBITRUM_V2_MAINNET)
    const basePoint = getAssetPoint(EndpointId.BASE_V2_MAINNET)
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)
    const gravityPoint = getAssetPoint(EndpointId.GRAVITY_V2_MAINNET)
    const iotaPoint = getAssetPoint(EndpointId.IOTA_V2_MAINNET)
    const klaytnPoint = getAssetPoint(EndpointId.KLAYTN_V2_MAINNET)
    const mantlePoint = getAssetPoint(EndpointId.MANTLE_V2_MAINNET)
    const metisPoint = getAssetPoint(EndpointId.METIS_V2_MAINNET)
    const optPoint = getAssetPoint(EndpointId.OPTIMISM_V2_MAINNET)
    const scrollPoint = getAssetPoint(EndpointId.SCROLL_V2_MAINNET)
    const seiPoint = getAssetPoint(EndpointId.SEI_V2_MAINNET)
    const zkConsensysPoint = getAssetPoint(EndpointId.ZKCONSENSYS_V2_MAINNET)

    // And all their nodes
    const arbContract = await getAssetNode(arbPoint)
    const baseContract = await getAssetNode(basePoint)
    const ethContract = await getAssetNode(ethPoint)
    const gravityContract = await getAssetNode(gravityPoint)
    const iotaContract = await getAssetNode(iotaPoint)
    const klaytnContract = await getAssetNode(klaytnPoint)
    const mantleContract = await getAssetNode(mantlePoint)
    const metisContract = await getAssetNode(metisPoint)
    const optContract = await getAssetNode(optPoint)
    const scrollContract = await getAssetNode(scrollPoint)
    const seiContract = await getAssetNode(seiPoint)
    const zkConsensysContract = await getAssetNode(zkConsensysPoint)

    return {
        contracts: [
            arbContract,
            ethContract,
            baseContract,
            gravityContract,
            iotaContract,
            klaytnContract,
            mantleContract,
            metisContract,
            optContract,
            scrollContract,
            seiContract,
            zkConsensysContract,
        ],
        connections: generateAssetConfig(tokenName, [
            arbPoint,
            ethPoint,
            basePoint,
            iotaPoint,
            gravityPoint,
            klaytnPoint,
            mantlePoint,
            metisPoint,
            optPoint,
            scrollPoint,
            seiPoint,
            zkConsensysPoint,
        ]),
    }
}

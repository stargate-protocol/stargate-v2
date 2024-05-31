import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { type TokenMessagingEdgeConfig, type TokenMessagingNodeConfig } from '../../../src/token-messaging'
import { generateTokenMessagingConfig, getSafeAddress } from '../../utils'
import {
    onArb,
    onAurora,
    onAvax,
    onBase,
    onBsc,
    onEbi,
    onEth,
    onKava,
    onKlaytn,
    onMantle,
    onMetis,
    onOpt,
    onPolygon,
    onRarible,
    onScroll,
    onZkConsensys,
} from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { getMessagingAssetConfig } from './shared'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    const getEnvironment = createGetHreByEid()
    const assetConfigs = await getMessagingAssetConfig(getEnvironment)

    const arbTokenMsging = onArb(contract)
    const auroraTokenMsging = onAurora(contract)
    const avaxTokenMsging = onAvax(contract)
    const baseTokenMsging = onBase(contract)
    const bscTokenMsging = onBsc(contract)
    const ebiTokenMsging = onEbi(contract)
    const ethTokenMsging = onEth(contract)
    const kavaTokenMsging = onKava(contract)
    const klaytnTokenMsging = onKlaytn(contract)
    const mantleTokenMsging = onMantle(contract)
    const metisTokenMsging = onMetis(contract)
    const optTokenMsging = onOpt(contract)
    const polygonTokenMsging = onPolygon(contract)
    const raribleTokenMsging = onRarible(contract)
    const scrollTokenMsging = onScroll(contract)
    const zkConsensysTokenMsging = onZkConsensys(contract)

    return {
        contracts: [
            {
                contract: arbTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ARBITRUM_V2_MAINNET],
                },
            },
            {
                contract: auroraTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.AURORA_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.AURORA_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.AURORA_V2_MAINNET],
                },
            },
            {
                contract: avaxTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.AVALANCHE_V2_MAINNET],
                },
            },
            {
                contract: baseTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.BASE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.BASE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.BASE_V2_MAINNET],
                },
            },
            {
                contract: bscTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.BSC_V2_MAINNET],
                },
            },
            {
                contract: ebiTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.EBI_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.EBI_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.EBI_V2_MAINNET],
                },
            },
            {
                contract: ethTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ETHEREUM_V2_MAINNET],
                },
            },
            {
                contract: kavaTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.KAVA_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.KAVA_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.KAVA_V2_MAINNET],
                },
            },
            {
                contract: klaytnTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.KLAYTN_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.KLAYTN_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.KLAYTN_V2_MAINNET],
                },
            },
            {
                contract: mantleTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.MANTLE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.MANTLE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.MANTLE_V2_MAINNET],
                },
            },
            {
                contract: metisTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.METIS_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.METIS_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.METIS_V2_MAINNET],
                },
            },
            {
                contract: optTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.OPTIMISM_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.OPTIMISM_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.OPTIMISM_V2_MAINNET],
                },
            },
            {
                contract: polygonTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.POLYGON_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.POLYGON_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.POLYGON_V2_MAINNET],
                },
            },
            {
                contract: raribleTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.RARIBLE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.RARIBLE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.RARIBLE_V2_MAINNET],
                },
            },
            {
                contract: scrollTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.SCROLL_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.SCROLL_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.SCROLL_V2_MAINNET],
                },
            },
            {
                contract: zkConsensysTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ZKCONSENSYS_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ZKCONSENSYS_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ZKCONSENSYS_V2_MAINNET],
                },
            },
        ],
        connections: generateTokenMessagingConfig([
            arbTokenMsging,
            auroraTokenMsging,
            avaxTokenMsging,
            baseTokenMsging,
            bscTokenMsging,
            ebiTokenMsging,
            ethTokenMsging,
            kavaTokenMsging,
            klaytnTokenMsging,
            mantleTokenMsging,
            metisTokenMsging,
            optTokenMsging,
            polygonTokenMsging,
            raribleTokenMsging,
            scrollTokenMsging,
            zkConsensysTokenMsging,
        ]),
    }
}

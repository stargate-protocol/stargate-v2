import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { generateTokenMessagingConfig, getSafeAddress } from '../../utils'
import {
    onArb,
    onAurora,
    onAvax,
    onBase,
    onBsc,
    onCoredao,
    onDegen,
    onEbi,
    onEth,
    onFlare,
    onGravity,
    onIota,
    onKava,
    onKlaytn,
    onMantle,
    onMetis,
    onOpt,
    onPolygon,
    onRarible,
    onScroll,
    onSei,
    onTaiko,
    onXchain,
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
    const coredaoTokenMsging = onCoredao(contract)
    const degenTokenMsging = onDegen(contract)
    const ebiTokenMsging = onEbi(contract)
    const ethTokenMsging = onEth(contract)
    const flareTokenMsging = onFlare(contract)
    const gravityTokenMsging = onGravity(contract)
    const iotaTokenMsging = onIota(contract)
    const kavaTokenMsging = onKava(contract)
    const klaytnTokenMsging = onKlaytn(contract)
    const mantleTokenMsging = onMantle(contract)
    const metisTokenMsging = onMetis(contract)
    const optTokenMsging = onOpt(contract)
    const polygonTokenMsging = onPolygon(contract)
    const raribleTokenMsging = onRarible(contract)
    const scrollTokenMsging = onScroll(contract)
    const seiTokenMsging = onSei(contract)
    const taikoTokenMsging = onTaiko(contract)
    const zkConsensysTokenMsging = onZkConsensys(contract)
    const xchainTokenMsging = onXchain(contract)

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
                contract: coredaoTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.COREDAO_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.COREDAO_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.COREDAO_V2_MAINNET],
                },
            },
            {
                contract: degenTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.DEGEN_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.DEGEN_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.DEGEN_V2_MAINNET],
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
                contract: flareTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.FLARE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.FLARE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.FLARE_V2_MAINNET],
                },
            },
            {
                contract: gravityTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.GRAVITY_V2_MAINNET],
                },
            },
            {
                contract: iotaTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.IOTA_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.IOTA_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.IOTA_V2_MAINNET],
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
                contract: seiTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.SEI_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.SEI_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.SEI_V2_MAINNET],
                },
            },
            {
                contract: taikoTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.TAIKO_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.TAIKO_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.TAIKO_V2_MAINNET],
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
            {
                contract: xchainTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.XCHAIN_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.XCHAIN_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.XCHAIN_V2_MAINNET],
                },
            },
        ],
        connections: generateTokenMessagingConfig([
            arbTokenMsging,
            auroraTokenMsging,
            avaxTokenMsging,
            baseTokenMsging,
            bscTokenMsging,
            coredaoTokenMsging,
            degenTokenMsging,
            ebiTokenMsging,
            ethTokenMsging,
            flareTokenMsging,
            gravityTokenMsging,
            iotaTokenMsging,
            kavaTokenMsging,
            klaytnTokenMsging,
            mantleTokenMsging,
            metisTokenMsging,
            optTokenMsging,
            polygonTokenMsging,
            raribleTokenMsging,
            scrollTokenMsging,
            seiTokenMsging,
            taikoTokenMsging,
            zkConsensysTokenMsging,
            xchainTokenMsging,
        ]),
    }
}

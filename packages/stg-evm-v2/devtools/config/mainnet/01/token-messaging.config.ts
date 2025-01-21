import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { generateTokenMessagingConfig, getSafeAddress } from '../../utils'
import {
    onAbstract,
    onArb,
    onAurora,
    onAvax,
    onBase,
    onBsc,
    onCodex,
    onCoredao,
    onDegen,
    onEbi,
    onEth,
    onFlare,
    onFuse,
    onGlue,
    onGravity,
    onHemi,
    onInk,
    onIota,
    onIslander,
    onKava,
    onKlaytn,
    onLightlink,
    onMantle,
    onMetis,
    onOpt,
    onPeaq,
    onPlume,
    onPolygon,
    onRarible,
    onRootstock,
    onScroll,
    onSei,
    onSuperposition,
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

    const abstractTokenMsging = onAbstract(contract)
    const arbTokenMsging = onArb(contract)
    const auroraTokenMsging = onAurora(contract)
    const avaxTokenMsging = onAvax(contract)
    const baseTokenMsging = onBase(contract)
    const bscTokenMsging = onBsc(contract)
    const codexTokenMsging = onCodex(contract)
    const coredaoTokenMsging = onCoredao(contract)
    const degenTokenMsging = onDegen(contract)
    const ebiTokenMsging = onEbi(contract)
    const ethTokenMsging = onEth(contract)
    const flareTokenMsging = onFlare(contract)
    const fuseTokenMsging = onFuse(contract)
    const glueTokenMsging = onGlue(contract)
    const gravityTokenMsging = onGravity(contract)
    const hemiTokenMsging = onHemi(contract)
    const inkTokenMsging = onInk(contract)
    const iotaTokenMsging = onIota(contract)
    const islanderTokenMsging = onIslander(contract)
    const kavaTokenMsging = onKava(contract)
    const klaytnTokenMsging = onKlaytn(contract)
    const lightlinkTokenMsging = onLightlink(contract)
    const mantleTokenMsging = onMantle(contract)
    const metisTokenMsging = onMetis(contract)
    const optTokenMsging = onOpt(contract)
    const peaqTokenMsging = onPeaq(contract)
    const plumeTokenMsging = onPlume(contract)
    const polygonTokenMsging = onPolygon(contract)
    const raribleTokenMsging = onRarible(contract)
    const rootstockTokenMsging = onRootstock(contract)
    const scrollTokenMsging = onScroll(contract)
    const seiTokenMsging = onSei(contract)
    const superpositionTokenMsging = onSuperposition(contract)
    const taikoTokenMsging = onTaiko(contract)
    const zkConsensysTokenMsging = onZkConsensys(contract)
    const xchainTokenMsging = onXchain(contract)

    return {
        contracts: [
            {
                contract: abstractTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ABSTRACT_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ABSTRACT_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ABSTRACT_V2_MAINNET],
                },
            },
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
                contract: codexTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.CODEX_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.CODEX_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.CODEX_V2_MAINNET],
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
                contract: fuseTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.FUSE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.FUSE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.FUSE_V2_MAINNET],
                },
            },
            {
                contract: glueTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.GLUE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.GLUE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.GLUE_V2_MAINNET],
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
                contract: hemiTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.HEMI_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.HEMI_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.HEMI_V2_MAINNET],
                },
            },
            {
                contract: inkTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.INK_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.INK_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.INK_V2_MAINNET],
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
                contract: islanderTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ISLANDER_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ISLANDER_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ISLANDER_V2_MAINNET],
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
                contract: lightlinkTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.LIGHTLINK_V2_MAINNET],
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
                contract: peaqTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.PEAQ_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.PEAQ_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.PEAQ_V2_MAINNET],
                },
            },
            {
                contract: plumeTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.PLUME_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.PLUME_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.PLUME_V2_MAINNET],
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
                contract: rootstockTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ROOTSTOCK_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ROOTSTOCK_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ROOTSTOCK_V2_MAINNET],
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
                contract: superpositionTokenMsging,
                config: {
                    owner: getSafeAddress(EndpointId.SUPERPOSITION_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.SUPERPOSITION_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.SUPERPOSITION_V2_MAINNET],
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
            abstractTokenMsging,
            arbTokenMsging,
            auroraTokenMsging,
            avaxTokenMsging,
            baseTokenMsging,
            bscTokenMsging,
            codexTokenMsging,
            coredaoTokenMsging,
            degenTokenMsging,
            ebiTokenMsging,
            ethTokenMsging,
            flareTokenMsging,
            fuseTokenMsging,
            glueTokenMsging,
            gravityTokenMsging,
            hemiTokenMsging,
            inkTokenMsging,
            iotaTokenMsging,
            islanderTokenMsging,
            kavaTokenMsging,
            klaytnTokenMsging,
            lightlinkTokenMsging,
            mantleTokenMsging,
            metisTokenMsging,
            optTokenMsging,
            peaqTokenMsging,
            plumeTokenMsging,
            polygonTokenMsging,
            raribleTokenMsging,
            rootstockTokenMsging,
            scrollTokenMsging,
            seiTokenMsging,
            superpositionTokenMsging,
            taikoTokenMsging,
            zkConsensysTokenMsging,
            xchainTokenMsging,
        ]),
    }
}

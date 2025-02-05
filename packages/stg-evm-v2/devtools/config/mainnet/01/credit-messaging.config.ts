import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { generateCreditMessagingConfig, getSafeAddress } from '../../utils'
import {
    onAbstract,
    onArb,
    onAurora,
    onAvax,
    onBase,
    onBera,
    onBsc,
    onCodex,
    onCoredao,
    onDegen,
    onEbi,
    onEth,
    onFlare,
    onFlow,
    onFuse,
    onGlue,
    onGnosis,
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
    onSoneium,
    onSuperposition,
    onTaiko,
    onXchain,
    onZkConsensys,
} from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { getMessagingAssetConfig } from './shared'

const contract = { contractName: 'CreditMessaging' }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const assetConfigs = await getMessagingAssetConfig(getEnvironment)

    const abstractCreditMsging = onAbstract(contract)
    const arbCreditMsging = onArb(contract)
    const auroraCreditMsging = onAurora(contract)
    const avaxCreditMsging = onAvax(contract)
    const baseCreditMsging = onBase(contract)
    const beraCreditMsging = onBera(contract)
    const bscCreditMsging = onBsc(contract)
    const codexCreditMsging = onCodex(contract)
    const coredaoCreditMsging = onCoredao(contract)
    const degenCreditMsging = onDegen(contract)
    const ebiCreditMsging = onEbi(contract)
    const ethCreditMsging = onEth(contract)
    const flareCreditMsging = onFlare(contract)
    const flowCreditMsging = onFlow(contract)
    const fuseCreditMsging = onFuse(contract)
    const glueCreditMsging = onGlue(contract)
    const gnosisCreditMsging = onGnosis(contract)
    const gravityCreditMsging = onGravity(contract)
    const hemiCreditMsging = onHemi(contract)
    const inkCreditMsging = onInk(contract)
    const iotaCreditMsging = onIota(contract)
    const islanderCreditMsging = onIslander(contract)
    const kavaCreditMsging = onKava(contract)
    const klaytnCreditMsging = onKlaytn(contract)
    const lightlinkCreditMsging = onLightlink(contract)
    const mantleCreditMsging = onMantle(contract)
    const metisCreditMsging = onMetis(contract)
    const optCreditMsging = onOpt(contract)
    const peaqCreditMsging = onPeaq(contract)
    const plumeCreditMsging = onPlume(contract)
    const polygonCreditMsging = onPolygon(contract)
    const raribleCreditMsging = onRarible(contract)
    const rootstockCreditMsging = onRootstock(contract)
    const scrollCreditMsging = onScroll(contract)
    const seiCreditMsging = onSei(contract)
    const soneiumCreditMsging = onSoneium(contract)
    const superpositionCreditMsging = onSuperposition(contract)
    const taikoCreditMsging = onTaiko(contract)
    const zkConsensysCreditMsging = onZkConsensys(contract)
    const xchainCreditMsging = onXchain(contract)

    return {
        contracts: [
            {
                contract: abstractCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ABSTRACT_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ABSTRACT_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ABSTRACT_V2_MAINNET],
                },
            },
            {
                contract: arbCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ARBITRUM_V2_MAINNET],
                },
            },
            {
                contract: auroraCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.AURORA_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.AURORA_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.AURORA_V2_MAINNET],
                },
            },
            {
                contract: avaxCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.AVALANCHE_V2_MAINNET],
                },
            },
            {
                contract: baseCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.BASE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.BASE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.BASE_V2_MAINNET],
                },
            },
            {
                contract: beraCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.BERA_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.BERA_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.BERA_V2_MAINNET],
                },
            },
            {
                contract: bscCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.BSC_V2_MAINNET],
                },
            },
            {
                contract: codexCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.CODEX_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.CODEX_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.CODEX_V2_MAINNET],
                },
            },
            {
                contract: coredaoCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.COREDAO_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.COREDAO_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.COREDAO_V2_MAINNET],
                },
            },
            {
                contract: degenCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.DEGEN_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.DEGEN_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.DEGEN_V2_MAINNET],
                },
            },
            {
                contract: ebiCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.EBI_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.EBI_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.EBI_V2_MAINNET],
                },
            },
            {
                contract: ethCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ETHEREUM_V2_MAINNET],
                },
            },
            {
                contract: flareCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.FLARE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.FLARE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.FLARE_V2_MAINNET],
                },
            },
            {
                contract: flowCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.FLOW_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.FLOW_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.FLOW_V2_MAINNET],
                },
            },
            {
                contract: fuseCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.FUSE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.FUSE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.FUSE_V2_MAINNET],
                },
            },
            {
                contract: glueCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.GLUE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.GLUE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.GLUE_V2_MAINNET],
                },
            },
            {
                contract: gnosisCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.GNOSIS_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.GNOSIS_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.GNOSIS_V2_MAINNET],
                },
            },
            {
                contract: gravityCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.GRAVITY_V2_MAINNET],
                },
            },
            {
                contract: hemiCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.HEMI_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.HEMI_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.HEMI_V2_MAINNET],
                },
            },
            {
                contract: inkCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.INK_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.INK_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.INK_V2_MAINNET],
                },
            },
            {
                contract: iotaCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.IOTA_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.IOTA_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.IOTA_V2_MAINNET],
                },
            },
            {
                contract: islanderCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ISLANDER_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ISLANDER_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ISLANDER_V2_MAINNET],
                },
            },
            {
                contract: kavaCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.KAVA_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.KAVA_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.KAVA_V2_MAINNET],
                },
            },
            {
                contract: klaytnCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.KLAYTN_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.KLAYTN_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.KLAYTN_V2_MAINNET],
                },
            },
            {
                contract: lightlinkCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.LIGHTLINK_V2_MAINNET],
                },
            },
            {
                contract: mantleCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.MANTLE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.MANTLE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.MANTLE_V2_MAINNET],
                },
            },
            {
                contract: metisCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.METIS_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.METIS_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.METIS_V2_MAINNET],
                },
            },
            {
                contract: optCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.OPTIMISM_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.OPTIMISM_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.OPTIMISM_V2_MAINNET],
                },
            },
            {
                contract: peaqCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.PEAQ_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.PEAQ_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.PEAQ_V2_MAINNET],
                },
            },
            {
                contract: plumeCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.PLUME_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.PLUME_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.PLUME_V2_MAINNET],
                },
            },
            {
                contract: polygonCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.POLYGON_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.POLYGON_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.POLYGON_V2_MAINNET],
                },
            },
            {
                contract: raribleCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.RARIBLE_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.RARIBLE_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.RARIBLE_V2_MAINNET],
                },
            },
            {
                contract: rootstockCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ROOTSTOCK_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ROOTSTOCK_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ROOTSTOCK_V2_MAINNET],
                },
            },
            {
                contract: scrollCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.SCROLL_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.SCROLL_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.SCROLL_V2_MAINNET],
                },
            },
            {
                contract: seiCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.SEI_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.SEI_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.SEI_V2_MAINNET],
                },
            },
            {
                contract: soneiumCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.SONEIUM_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.SONEIUM_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.SONEIUM_V2_MAINNET],
                },
            },
            {
                contract: superpositionCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.SUPERPOSITION_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.SUPERPOSITION_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.SUPERPOSITION_V2_MAINNET],
                },
            },
            {
                contract: taikoCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.TAIKO_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.TAIKO_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.TAIKO_V2_MAINNET],
                },
            },
            {
                contract: zkConsensysCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.ZKCONSENSYS_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.ZKCONSENSYS_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.ZKCONSENSYS_V2_MAINNET],
                },
            },
            {
                contract: xchainCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.XCHAIN_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.XCHAIN_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.XCHAIN_V2_MAINNET],
                },
            },
        ],
        connections: generateCreditMessagingConfig([
            abstractCreditMsging,
            arbCreditMsging,
            auroraCreditMsging,
            avaxCreditMsging,
            baseCreditMsging,
            beraCreditMsging,
            bscCreditMsging,
            codexCreditMsging,
            coredaoCreditMsging,
            degenCreditMsging,
            ebiCreditMsging,
            ethCreditMsging,
            flareCreditMsging,
            flowCreditMsging,
            fuseCreditMsging,
            glueCreditMsging,
            gnosisCreditMsging,
            gravityCreditMsging,
            hemiCreditMsging,
            inkCreditMsging,
            iotaCreditMsging,
            islanderCreditMsging,
            kavaCreditMsging,
            klaytnCreditMsging,
            lightlinkCreditMsging,
            mantleCreditMsging,
            metisCreditMsging,
            optCreditMsging,
            peaqCreditMsging,
            plumeCreditMsging,
            polygonCreditMsging,
            raribleCreditMsging,
            rootstockCreditMsging,
            scrollCreditMsging,
            seiCreditMsging,
            soneiumCreditMsging,
            superpositionCreditMsging,
            taikoCreditMsging,
            zkConsensysCreditMsging,
            xchainCreditMsging,
        ]),
    }
}

import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { generateCreditMessagingConfig, getSafeAddress } from '../../utils'
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

const contract = { contractName: 'CreditMessaging' }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const assetConfigs = await getMessagingAssetConfig(getEnvironment)

    const arbCreditMsging = onArb(contract)
    const auroraCreditMsging = onAurora(contract)
    const avaxCreditMsging = onAvax(contract)
    const baseCreditMsging = onBase(contract)
    const bscCreditMsging = onBsc(contract)
    const coredaoCreditMsging = onCoredao(contract)
    const degenCreditMsging = onDegen(contract)
    const ebiCreditMsging = onEbi(contract)
    const ethCreditMsging = onEth(contract)
    const flareCreditMsging = onFlare(contract)
    const gravityCreditMsging = onGravity(contract)
    const iotaCreditMsging = onIota(contract)
    const kavaCreditMsging = onKava(contract)
    const klaytnCreditMsging = onKlaytn(contract)
    const mantleCreditMsging = onMantle(contract)
    const metisCreditMsging = onMetis(contract)
    const optCreditMsging = onOpt(contract)
    const polygonCreditMsging = onPolygon(contract)
    const raribleCreditMsging = onRarible(contract)
    const scrollCreditMsging = onScroll(contract)
    const seiCreditMsging = onSei(contract)
    const taikoCreditMsging = onTaiko(contract)
    const zkConsensysCreditMsging = onZkConsensys(contract)
    const xchainCreditMsging = onXchain(contract)

    return {
        contracts: [
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
                contract: bscCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.BSC_V2_MAINNET],
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
                contract: gravityCreditMsging,
                config: {
                    owner: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                    delegate: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                    planner: DEFAULT_PLANNER,
                    assets: assetConfigs[EndpointId.GRAVITY_V2_MAINNET],
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
            arbCreditMsging,
            auroraCreditMsging,
            avaxCreditMsging,
            baseCreditMsging,
            bscCreditMsging,
            coredaoCreditMsging,
            degenCreditMsging,
            ebiCreditMsging,
            ethCreditMsging,
            flareCreditMsging,
            gravityCreditMsging,
            iotaCreditMsging,
            kavaCreditMsging,
            klaytnCreditMsging,
            mantleCreditMsging,
            metisCreditMsging,
            optCreditMsging,
            polygonCreditMsging,
            raribleCreditMsging,
            scrollCreditMsging,
            seiCreditMsging,
            taikoCreditMsging,
            zkConsensysCreditMsging,
            xchainCreditMsging,
        ]),
    }
}

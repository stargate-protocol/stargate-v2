import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { TreasurerNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
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
    onGoat,
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
    onStory,
    onSuperposition,
    onTaiko,
    onUnichain,
    onXchain,
    onZkConsensys,
} from '../utils'

const contract = { contractName: 'Treasurer' }

export default async (): Promise<OmniGraphHardhat<TreasurerNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // Named accounts retrieval
    const abstractAdmin = getSafeAddress(EndpointId.ABSTRACT_V2_MAINNET)
    const arbAdmin = getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET)
    const auroraAdmin = getSafeAddress(EndpointId.AURORA_V2_MAINNET)
    const avaxAdmin = getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET)
    const baseAdmin = getSafeAddress(EndpointId.BASE_V2_MAINNET)
    const beraAdmin = getSafeAddress(EndpointId.BERA_V2_MAINNET)
    const bscAdmin = getSafeAddress(EndpointId.BSC_V2_MAINNET)
    const codexAdmin = getSafeAddress(EndpointId.CODEX_V2_MAINNET)
    const coredaoAdmin = getSafeAddress(EndpointId.COREDAO_V2_MAINNET)
    const degenAdmin = getSafeAddress(EndpointId.DEGEN_V2_MAINNET)
    const ebiAdmin = getSafeAddress(EndpointId.EBI_V2_MAINNET)
    const ethAdmin = getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET)
    const flareAdmin = getSafeAddress(EndpointId.FLARE_V2_MAINNET)
    const flowAdmin = getSafeAddress(EndpointId.FLOW_V2_MAINNET)
    const fuseAdmin = getSafeAddress(EndpointId.FUSE_V2_MAINNET)
    const glueAdmin = getSafeAddress(EndpointId.GLUE_V2_MAINNET)
    const gnosisAdmin = getSafeAddress(EndpointId.GNOSIS_V2_MAINNET)
    const goatAdmin = getSafeAddress(EndpointId.GOAT_V2_MAINNET)
    const gravityAdmin = getSafeAddress(EndpointId.GRAVITY_V2_MAINNET)
    const hemiAdmin = getSafeAddress(EndpointId.HEMI_V2_MAINNET)
    const inkAdmin = getSafeAddress(EndpointId.INK_V2_MAINNET)
    const iotaAdmin = getSafeAddress(EndpointId.IOTA_V2_MAINNET)
    const islanderAdmin = getSafeAddress(EndpointId.ISLANDER_V2_MAINNET)
    const kavaAdmin = getSafeAddress(EndpointId.KAVA_V2_MAINNET)
    const klaytnAdmin = getSafeAddress(EndpointId.KLAYTN_V2_MAINNET)
    const lightlinkAdmin = getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET)
    const mantleAdmin = getSafeAddress(EndpointId.MANTLE_V2_MAINNET)
    const metisAdmin = getSafeAddress(EndpointId.METIS_V2_MAINNET)
    const optAdmin = getSafeAddress(EndpointId.OPTIMISM_V2_MAINNET)
    const peaqAdmin = getSafeAddress(EndpointId.PEAQ_V2_MAINNET)
    const plumeAdmin = getSafeAddress(EndpointId.PLUME_V2_MAINNET)
    const polygonAdmin = getSafeAddress(EndpointId.POLYGON_V2_MAINNET)
    const raribleAdmin = getSafeAddress(EndpointId.RARIBLE_V2_MAINNET)
    const rootStockAdmin = getSafeAddress(EndpointId.ROOTSTOCK_V2_MAINNET)
    const scrollAdmin = getSafeAddress(EndpointId.SCROLL_V2_MAINNET)
    const seiAdmin = getSafeAddress(EndpointId.SEI_V2_MAINNET)
    const soneiumAdmin = getSafeAddress(EndpointId.SONEIUM_V2_MAINNET)
    const storyAdmin = getSafeAddress(EndpointId.STORY_V2_MAINNET)
    const superpositionAdmin = getSafeAddress(EndpointId.SUPERPOSITION_V2_MAINNET)
    const taikoAdmin = getSafeAddress(EndpointId.TAIKO_V2_MAINNET)
    const unichainAdmin = getSafeAddress(EndpointId.UNICHAIN_V2_MAINNET)
    const zkConsensysAdmin = getSafeAddress(EndpointId.ZKCONSENSYS_V2_MAINNET)
    const xchainAdmin = getSafeAddress(EndpointId.XCHAIN_V2_MAINNET)

    // Now we collect the address of the deployed assets
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const abstractAssetAddresses = await getAssetAddresses(EndpointId.ABSTRACT_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const arbAssetAddresses = await getAssetAddresses(EndpointId.ARBITRUM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const auroraAssetAddresses = await getAssetAddresses(EndpointId.AURORA_V2_MAINNET, [TokenName.USDC] as const)
    const avaxAssetAddresses = await getAssetAddresses(EndpointId.AVALANCHE_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const baseAssetAddresses = await getAssetAddresses(EndpointId.BASE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const beraAssetAddresses = await getAssetAddresses(EndpointId.BERA_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const codexAssetAddresses = await getAssetAddresses(EndpointId.CODEX_V2_MAINNET, [TokenName.USDC] as const)
    const coredaoAssetAddresses = await getAssetAddresses(EndpointId.COREDAO_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const degenAssetAddresses = await getAssetAddresses(EndpointId.DEGEN_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const ebiAssetAddresses = await getAssetAddresses(EndpointId.EBI_V2_MAINNET, [TokenName.USDT] as const)
    const ethAssetAddresses = await getAssetAddresses(EndpointId.ETHEREUM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.METIS,
        TokenName.mETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const flareAssetAddresses = await getAssetAddresses(EndpointId.FLARE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const flowAssetAddresses = await getAssetAddresses(EndpointId.FLOW_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const fuseAssetAddresses = await getAssetAddresses(EndpointId.FUSE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const glueAssetAddresses = await getAssetAddresses(EndpointId.GLUE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
        TokenName.USDC,
    ] as const)
    const gnosisAssetAddresses = await getAssetAddresses(EndpointId.GNOSIS_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const goatAssetAddresses = await getAssetAddresses(EndpointId.GOAT_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const gravityAssetAddresses = await getAssetAddresses(EndpointId.GRAVITY_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const hemiAssetAddresses = await getAssetAddresses(EndpointId.HEMI_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const inkAssetAddresses = await getAssetAddresses(EndpointId.INK_V2_MAINNET, [TokenName.USDC] as const)
    const iotaAssetAddresses = await getAssetAddresses(EndpointId.IOTA_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const islanderAssetAddresses = await getAssetAddresses(EndpointId.ISLANDER_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const kavaAssetAddresses = await getAssetAddresses(EndpointId.KAVA_V2_MAINNET, [TokenName.USDT] as const)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const lightlinkAssetAddresses = await getAssetAddresses(EndpointId.LIGHTLINK_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const mantleAssetAddresses = await getAssetAddresses(EndpointId.MANTLE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.mETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const metisAssetAddresses = await getAssetAddresses(EndpointId.METIS_V2_MAINNET, [
        TokenName.ETH,
        TokenName.METIS,
        TokenName.USDT,
    ] as const)
    const optAssetAddresses = await getAssetAddresses(EndpointId.OPTIMISM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const peaqAssetAddresses = await getAssetAddresses(EndpointId.PEAQ_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const plumeAssetAddresses = await getAssetAddresses(EndpointId.PLUME_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const polygonAssetAddresses = await getAssetAddresses(EndpointId.POLYGON_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const raribleAssetAddresses = await getAssetAddresses(EndpointId.RARIBLE_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const rootstockAssetAddresses = await getAssetAddresses(EndpointId.ROOTSTOCK_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const scrollAssetAddresses = await getAssetAddresses(EndpointId.SCROLL_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const seiAssetAddresses = await getAssetAddresses(EndpointId.SEI_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const soneiumAssetAddresses = await getAssetAddresses(EndpointId.SONEIUM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const storyAssetAddresses = await getAssetAddresses(EndpointId.STORY_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const superpositionAssetAddresses = await getAssetAddresses(EndpointId.SUPERPOSITION_V2_MAINNET, [
        TokenName.USDC,
    ] as const)
    const taikoAssetAddresses = await getAssetAddresses(EndpointId.TAIKO_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const unichainAssetAddresses = await getAssetAddresses(EndpointId.UNICHAIN_V2_MAINNET, [TokenName.ETH] as const)
    const zkConsensysAssetAddresses = await getAssetAddresses(EndpointId.ZKCONSENSYS_V2_MAINNET, [
        TokenName.ETH,
    ] as const)
    const xchainAssetAddresses = await getAssetAddresses(EndpointId.XCHAIN_V2_MAINNET, [TokenName.USDC] as const)

    return {
        contracts: [
            {
                contract: onAbstract(contract),
                config: {
                    owner: abstractAdmin,
                    admin: abstractAdmin,
                    assets: {
                        [abstractAssetAddresses.USDC]: true,
                        [abstractAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onArb(contract),
                config: {
                    owner: arbAdmin,
                    admin: arbAdmin,
                    assets: {
                        [arbAssetAddresses.ETH]: true,
                        [arbAssetAddresses.USDC]: true,
                        [arbAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onAurora(contract),
                config: {
                    owner: auroraAdmin,
                    admin: auroraAdmin,
                    assets: {
                        [auroraAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onAvax(contract),
                config: {
                    owner: avaxAdmin,
                    admin: avaxAdmin,
                    assets: {
                        [avaxAssetAddresses.USDC]: true,
                        [avaxAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onBase(contract),
                config: {
                    owner: baseAdmin,
                    admin: baseAdmin,
                    assets: {
                        [baseAssetAddresses.ETH]: true,
                        [baseAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onBera(contract),
                config: {
                    owner: beraAdmin,
                    admin: beraAdmin,
                    assets: {
                        [beraAssetAddresses.ETH]: true,
                        [beraAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onBsc(contract),
                config: {
                    owner: bscAdmin,
                    admin: bscAdmin,
                    assets: {
                        [bscAssetAddresses.USDC]: true,
                        [bscAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onCodex(contract),
                config: {
                    owner: codexAdmin,
                    admin: codexAdmin,
                    assets: {
                        [codexAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onCoredao(contract),
                config: {
                    owner: coredaoAdmin,
                    admin: coredaoAdmin,
                    assets: {
                        [coredaoAssetAddresses.USDC]: true,
                        [coredaoAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onDegen(contract),
                config: {
                    owner: degenAdmin,
                    admin: degenAdmin,
                    assets: {
                        [degenAssetAddresses.ETH]: true,
                        [degenAssetAddresses.USDC]: true,
                        [degenAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onEbi(contract),
                config: {
                    owner: ebiAdmin,
                    admin: ebiAdmin,
                    assets: {
                        [ebiAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onEth(contract),
                config: {
                    owner: ethAdmin,
                    admin: ethAdmin,
                    assets: {
                        [ethAssetAddresses.ETH]: true,
                        [ethAssetAddresses.METIS]: true,
                        [ethAssetAddresses.mETH]: true,
                        [ethAssetAddresses.USDC]: true,
                        [ethAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onFlare(contract),
                config: {
                    owner: flareAdmin,
                    admin: flareAdmin,
                    assets: {
                        [flareAssetAddresses.ETH]: true,
                        [flareAssetAddresses.USDC]: true,
                        [flareAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onFlow(contract),
                config: {
                    owner: flowAdmin,
                    admin: flowAdmin,
                    assets: {
                        [flowAssetAddresses.ETH]: true,
                        [flowAssetAddresses.USDC]: true,
                        [flowAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onFuse(contract),
                config: {
                    owner: fuseAdmin,
                    admin: fuseAdmin,
                    assets: {
                        [fuseAssetAddresses.ETH]: true,
                        [fuseAssetAddresses.USDC]: true,
                        [fuseAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onGlue(contract),
                config: {
                    owner: glueAdmin,
                    admin: glueAdmin,
                    assets: {
                        [glueAssetAddresses.ETH]: true,
                        [glueAssetAddresses.USDT]: true,
                        [glueAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onGnosis(contract),
                config: {
                    owner: gnosisAdmin,
                    admin: gnosisAdmin,
                    assets: {
                        [gnosisAssetAddresses.ETH]: true,
                        [gnosisAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onGoat(contract),
                config: {
                    owner: goatAdmin,
                    admin: goatAdmin,
                    assets: {
                        [goatAssetAddresses.ETH]: true,
                        [goatAssetAddresses.USDC]: true,
                        [goatAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onGravity(contract),
                config: {
                    owner: gravityAdmin,
                    admin: gravityAdmin,
                    assets: {
                        [gravityAssetAddresses.ETH]: true,
                        [gravityAssetAddresses.USDC]: true,
                        [gravityAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onHemi(contract),
                config: {
                    owner: hemiAdmin,
                    admin: hemiAdmin,
                    assets: {
                        [hemiAssetAddresses.ETH]: true,
                        [hemiAssetAddresses.USDC]: true,
                        [hemiAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onIota(contract),
                config: {
                    owner: iotaAdmin,
                    admin: iotaAdmin,
                    assets: {
                        [iotaAssetAddresses.ETH]: true,
                        [iotaAssetAddresses.USDC]: true,
                        [iotaAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onInk(contract),
                config: {
                    owner: inkAdmin,
                    admin: inkAdmin,
                    assets: {
                        [inkAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onIslander(contract),
                config: {
                    owner: islanderAdmin,
                    admin: islanderAdmin,
                    assets: {
                        [islanderAssetAddresses.ETH]: true,
                        [islanderAssetAddresses.USDC]: true,
                        [islanderAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onKava(contract),
                config: {
                    owner: kavaAdmin,
                    admin: kavaAdmin,
                    assets: {
                        [kavaAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onKlaytn(contract),
                config: {
                    owner: klaytnAdmin,
                    admin: klaytnAdmin,
                    assets: {
                        [klaytnAssetAddresses.ETH]: true,
                        [klaytnAssetAddresses.USDC]: true,
                        [klaytnAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onLightlink(contract),
                config: {
                    owner: lightlinkAdmin,
                    admin: lightlinkAdmin,
                    assets: {
                        [lightlinkAssetAddresses.ETH]: true,
                        [lightlinkAssetAddresses.USDC]: true,
                        [lightlinkAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onMantle(contract),
                config: {
                    owner: mantleAdmin,
                    admin: mantleAdmin,
                    assets: {
                        [mantleAssetAddresses.ETH]: true,
                        [mantleAssetAddresses.mETH]: true,
                        [mantleAssetAddresses.USDC]: true,
                        [mantleAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onMetis(contract),
                config: {
                    owner: metisAdmin,
                    admin: metisAdmin,
                    assets: {
                        [metisAssetAddresses.ETH]: true,
                        [metisAssetAddresses.METIS]: true,
                        [metisAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onOpt(contract),
                config: {
                    owner: optAdmin,
                    admin: optAdmin,
                    assets: {
                        [optAssetAddresses.ETH]: true,
                        [optAssetAddresses.USDC]: true,
                        [optAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onPeaq(contract),
                config: {
                    owner: peaqAdmin,
                    admin: peaqAdmin,
                    assets: {
                        [peaqAssetAddresses.ETH]: true,
                        [peaqAssetAddresses.USDC]: true,
                        [peaqAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onPlume(contract),
                config: {
                    owner: plumeAdmin,
                    admin: plumeAdmin,
                    assets: {
                        [plumeAssetAddresses.USDC]: true,
                        [plumeAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onPolygon(contract),
                config: {
                    owner: polygonAdmin,
                    admin: polygonAdmin,
                    assets: {
                        [polygonAssetAddresses.USDC]: true,
                        [polygonAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onRarible(contract),
                config: {
                    owner: raribleAdmin,
                    admin: raribleAdmin,
                    assets: {
                        [raribleAssetAddresses.USDC]: true,
                        [raribleAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onRootstock(contract),
                config: {
                    owner: rootStockAdmin,
                    admin: rootStockAdmin,
                    assets: {
                        [rootstockAssetAddresses.ETH]: true,
                        [rootstockAssetAddresses.USDC]: true,
                        [rootstockAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onScroll(contract),
                config: {
                    owner: scrollAdmin,
                    admin: scrollAdmin,
                    assets: {
                        [scrollAssetAddresses.ETH]: true,
                        [scrollAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onSei(contract),
                config: {
                    owner: seiAdmin,
                    admin: seiAdmin,
                    assets: {
                        [seiAssetAddresses.ETH]: true,
                        [seiAssetAddresses.USDC]: true,
                        [seiAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onSoneium(contract),
                config: {
                    owner: soneiumAdmin,
                    admin: soneiumAdmin,
                    assets: {
                        [soneiumAssetAddresses.ETH]: true,
                        [soneiumAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onStory(contract),
                config: {
                    owner: storyAdmin,
                    admin: storyAdmin,
                    assets: {
                        [storyAssetAddresses.ETH]: true,
                        [storyAssetAddresses.USDC]: true,
                        [storyAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onSuperposition(contract),
                config: {
                    owner: superpositionAdmin,
                    admin: superpositionAdmin,
                    assets: {
                        [superpositionAssetAddresses.USDC]: true,
                    },
                },
            },
            {
                contract: onTaiko(contract),
                config: {
                    owner: taikoAdmin,
                    admin: taikoAdmin,
                    assets: {
                        [taikoAssetAddresses.USDC]: true,
                        [taikoAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onUnichain(contract),
                config: {
                    owner: unichainAdmin,
                    admin: unichainAdmin,
                    assets: {
                        [unichainAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onZkConsensys(contract),
                config: {
                    owner: zkConsensysAdmin,
                    admin: zkConsensysAdmin,
                    assets: {
                        [zkConsensysAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onXchain(contract),
                config: {
                    owner: xchainAdmin,
                    admin: xchainAdmin,
                    assets: {
                        [xchainAssetAddresses.USDC]: true,
                    },
                },
            },
        ],
        connections: [],
    }
}

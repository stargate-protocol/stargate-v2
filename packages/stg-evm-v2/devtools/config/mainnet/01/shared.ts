import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'
import { MessagingAssetConfig } from '@stargatefinance/stg-devtools-v2'

import { createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses, createGetLPTokenAddresses } from '../../../../ts-src/utils/util'

export const getMessagingAssetConfig = async (getEnvironment = createGetHreByEid()) => {
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    const abstractAssetAddresses = await getAssetAddresses(EndpointId.ABSTRACT_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const apeAssetAddresses = await getAssetAddresses(EndpointId.APE_V2_MAINNET, [
        TokenName.ETH,
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
    const cronosevmAssetAddresses = await getAssetAddresses(EndpointId.CRONOSEVM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const degenAssetAddresses = await getAssetAddresses(EndpointId.DEGEN_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
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
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const goatAssetAddresses = await getAssetAddresses(EndpointId.GOAT_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const gnosisAssetAddresses = await getAssetAddresses(EndpointId.GNOSIS_V2_MAINNET, [
        TokenName.USDC,
        TokenName.ETH,
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
    const plumephoenixAssetAddresses = await getAssetAddresses(EndpointId.PLUMEPHOENIX_V2_MAINNET, [
        TokenName.ETH,
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
    const sonicAssetAddresses = await getAssetAddresses(EndpointId.SONIC_V2_MAINNET, [TokenName.USDC] as const)
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
    const telosAssetAddress = await getAssetAddresses(EndpointId.TELOS_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const unichainAssetAddresses = await getAssetAddresses(EndpointId.UNICHAIN_V2_MAINNET, [TokenName.ETH] as const)
    const zkConsensysAssetAddresses = await getAssetAddresses(EndpointId.ZKCONSENSYS_V2_MAINNET, [
        TokenName.ETH,
    ] as const)
    const xchainAssetAddresses = await getAssetAddresses(EndpointId.XCHAIN_V2_MAINNET, [TokenName.USDC] as const)

    return {
        [EndpointId.ABSTRACT_V2_MAINNET]: {
            [abstractAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [abstractAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [abstractAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.APE_V2_MAINNET]: {
            [apeAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [apeAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [apeAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.ARBITRUM_V2_MAINNET]: {
            [arbAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [arbAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [arbAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.AURORA_V2_MAINNET]: {
            [auroraAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.AVALANCHE_V2_MAINNET]: {
            [avaxAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [avaxAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.BASE_V2_MAINNET]: {
            [baseAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [baseAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.BERA_V2_MAINNET]: {
            [beraAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [beraAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.BSC_V2_MAINNET]: {
            [bscAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [bscAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.CODEX_V2_MAINNET]: {
            [codexAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.COREDAO_V2_MAINNET]: {
            [coredaoAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [coredaoAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.CRONOSEVM_V2_MAINNET]: {
            [cronosevmAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [cronosevmAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.DEGEN_V2_MAINNET]: {
            [degenAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [degenAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [degenAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.ETHEREUM_V2_MAINNET]: {
            [ethAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [ethAssetAddresses.mETH]: ASSETS[TokenName.mETH].assetId,
            [ethAssetAddresses.METIS]: ASSETS[TokenName.METIS].assetId,
            [ethAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [ethAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.FLARE_V2_MAINNET]: {
            [flareAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [flareAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [flareAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.FLOW_V2_MAINNET]: {
            [flowAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [flowAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [flowAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.FUSE_V2_MAINNET]: {
            [fuseAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [fuseAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [fuseAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.GLUE_V2_MAINNET]: {
            [glueAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [glueAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [glueAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.GOAT_V2_MAINNET]: {
            [goatAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [goatAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [goatAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.GNOSIS_V2_MAINNET]: {
            [gnosisAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [gnosisAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
        },
        [EndpointId.GRAVITY_V2_MAINNET]: {
            [gravityAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [gravityAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [gravityAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.HEMI_V2_MAINNET]: {
            [hemiAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [hemiAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [hemiAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.INK_V2_MAINNET]: {
            [inkAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.IOTA_V2_MAINNET]: {
            [iotaAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [iotaAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [iotaAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.ISLANDER_V2_MAINNET]: {
            [islanderAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [islanderAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [islanderAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.KAVA_V2_MAINNET]: {
            [kavaAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.KLAYTN_V2_MAINNET]: {
            [klaytnAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [klaytnAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [klaytnAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.LIGHTLINK_V2_MAINNET]: {
            [lightlinkAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [lightlinkAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [lightlinkAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.MANTLE_V2_MAINNET]: {
            [mantleAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [mantleAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [mantleAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
            [mantleAssetAddresses.mETH]: ASSETS[TokenName.mETH].assetId,
        },
        [EndpointId.METIS_V2_MAINNET]: {
            [metisAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [metisAssetAddresses.METIS]: ASSETS[TokenName.METIS].assetId,
            [metisAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.OPTIMISM_V2_MAINNET]: {
            [optAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [optAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [optAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.PEAQ_V2_MAINNET]: {
            [peaqAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [peaqAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [peaqAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.PLUME_V2_MAINNET]: {
            [plumeAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [plumeAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.PLUMEPHOENIX_V2_MAINNET]: {
            [plumephoenixAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [plumephoenixAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [plumephoenixAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.POLYGON_V2_MAINNET]: {
            [polygonAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [polygonAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.RARIBLE_V2_MAINNET]: {
            [raribleAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [raribleAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.ROOTSTOCK_V2_MAINNET]: {
            [rootstockAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [rootstockAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [rootstockAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.SCROLL_V2_MAINNET]: {
            [scrollAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [scrollAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.SEI_V2_MAINNET]: {
            [seiAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [seiAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [seiAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.SONEIUM_V2_MAINNET]: {
            [soneiumAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [soneiumAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.SONIC_V2_MAINNET]: {
            [sonicAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.STORY_V2_MAINNET]: {
            [storyAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [storyAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [storyAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.SUPERPOSITION_V2_MAINNET]: {
            [superpositionAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
        [EndpointId.TAIKO_V2_MAINNET]: {
            [taikoAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [taikoAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.TELOS_V2_MAINNET]: {
            [telosAssetAddress.ETH]: ASSETS[TokenName.ETH].assetId,
            [telosAssetAddress.USDC]: ASSETS[TokenName.USDC].assetId,
            [telosAssetAddress.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.UNICHAIN_V2_MAINNET]: {
            [unichainAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
        },
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: {
            [zkConsensysAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
        },
        [EndpointId.XCHAIN_V2_MAINNET]: {
            [xchainAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
        },
    } satisfies Partial<Record<EndpointId, MessagingAssetConfig>>
}

export const getLPTokenAddresses = async (getEnvironment = createGetHreByEid()) => {
    const getLPTokenAddresses = createGetLPTokenAddresses(getEnvironment)
    const abstractLPTokenAddresses = await getLPTokenAddresses(EndpointId.ABSTRACT_V2_MAINNET, [TokenName.ETH] as const)
    const arbLPTokenAddresses = await getLPTokenAddresses(EndpointId.ARBITRUM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const auroraLPTokenAddresses = await getLPTokenAddresses(EndpointId.AURORA_V2_MAINNET, [TokenName.USDC] as const)
    const avaxLPTokenAddresses = await getLPTokenAddresses(EndpointId.AVALANCHE_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const baseLPTokenAddresses = await getLPTokenAddresses(EndpointId.BASE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const bscLPTokenAddresses = await getLPTokenAddresses(EndpointId.BSC_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const coredaoLPTokenAddresses = await getLPTokenAddresses(EndpointId.COREDAO_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const ethLPTokenAddresses = await getLPTokenAddresses(EndpointId.ETHEREUM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.METIS,
        TokenName.USDC,
        TokenName.USDT,
        TokenName.mETH,
    ] as const)
    const gnosisLPTokenAddresses = await getLPTokenAddresses(EndpointId.GNOSIS_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const hemiLPTokenAddresses = await getLPTokenAddresses(EndpointId.HEMI_V2_MAINNET, [TokenName.ETH] as const)
    const kavaLPTokenAddresses = await getLPTokenAddresses(EndpointId.KAVA_V2_MAINNET, [TokenName.USDT] as const)
    const lightlinkLPTokenAddresses = await getLPTokenAddresses(EndpointId.LIGHTLINK_V2_MAINNET, [
        TokenName.ETH,
    ] as const)
    const mantleLPTokenAddresses = await getLPTokenAddresses(EndpointId.MANTLE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.mETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const metisLPTokenAddresses = await getLPTokenAddresses(EndpointId.METIS_V2_MAINNET, [
        TokenName.ETH,
        TokenName.METIS,
        TokenName.USDT,
    ] as const)
    const optLPTokenAddresses = await getLPTokenAddresses(EndpointId.OPTIMISM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const polygonLPTokenAddresses = await getLPTokenAddresses(EndpointId.POLYGON_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const scrollLPTokenAddresses = await getLPTokenAddresses(EndpointId.SCROLL_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const seiLPTokenAddresses = await getLPTokenAddresses(EndpointId.SEI_V2_MAINNET, [
        TokenName.USDC,
        TokenName.USDT,
    ] as const)
    const soneiumLPTokenAddresses = await getLPTokenAddresses(EndpointId.SONEIUM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const sonicLPTokenAddresses = await getLPTokenAddresses(EndpointId.SONIC_V2_MAINNET, [TokenName.USDC] as const)
    const zkConsensysLPTokenAddresses = await getLPTokenAddresses(EndpointId.ZKCONSENSYS_V2_MAINNET, [
        TokenName.ETH,
    ] as const)

    return {
        [EndpointId.ABSTRACT_V2_MAINNET]: {
            [TokenName.ETH]: abstractLPTokenAddresses.ETH,
        },
        [EndpointId.ARBITRUM_V2_MAINNET]: {
            [TokenName.ETH]: arbLPTokenAddresses.ETH,
            [TokenName.USDC]: arbLPTokenAddresses.USDC,
            [TokenName.USDT]: arbLPTokenAddresses.USDT,
        },
        [EndpointId.AURORA_V2_MAINNET]: {
            [TokenName.USDC]: auroraLPTokenAddresses.USDC,
        },
        [EndpointId.AVALANCHE_V2_MAINNET]: {
            [TokenName.USDC]: avaxLPTokenAddresses.USDC,
            [TokenName.USDT]: avaxLPTokenAddresses.USDT,
        },
        [EndpointId.BASE_V2_MAINNET]: {
            [TokenName.ETH]: baseLPTokenAddresses.ETH,
            [TokenName.USDC]: baseLPTokenAddresses.USDC,
        },
        [EndpointId.BSC_V2_MAINNET]: {
            [TokenName.USDC]: bscLPTokenAddresses.USDC,
            [TokenName.USDT]: bscLPTokenAddresses.USDT,
        },
        [EndpointId.COREDAO_V2_MAINNET]: {
            [TokenName.USDC]: coredaoLPTokenAddresses.USDC,
            [TokenName.USDT]: coredaoLPTokenAddresses.USDT,
        },
        [EndpointId.ETHEREUM_V2_MAINNET]: {
            [TokenName.ETH]: ethLPTokenAddresses.ETH,
            [TokenName.USDC]: ethLPTokenAddresses.USDC,
            [TokenName.USDT]: ethLPTokenAddresses.USDT,
        },
        [EndpointId.GNOSIS_V2_MAINNET]: {
            [TokenName.ETH]: gnosisLPTokenAddresses.ETH,
            [TokenName.USDC]: gnosisLPTokenAddresses.USDC,
        },
        [EndpointId.HEMI_V2_MAINNET]: {
            [TokenName.ETH]: hemiLPTokenAddresses.ETH,
        },
        [EndpointId.KAVA_V2_MAINNET]: {
            [TokenName.USDT]: kavaLPTokenAddresses.USDT,
        },
        [EndpointId.LIGHTLINK_V2_MAINNET]: {
            [TokenName.ETH]: lightlinkLPTokenAddresses.ETH,
        },
        [EndpointId.MANTLE_V2_MAINNET]: {
            [TokenName.ETH]: mantleLPTokenAddresses.ETH,
            [TokenName.USDC]: mantleLPTokenAddresses.USDC,
            [TokenName.USDT]: mantleLPTokenAddresses.USDT,
        },
        [EndpointId.METIS_V2_MAINNET]: {
            [TokenName.ETH]: metisLPTokenAddresses.ETH,
            [TokenName.USDT]: metisLPTokenAddresses.USDT,
        },
        [EndpointId.OPTIMISM_V2_MAINNET]: {
            [TokenName.ETH]: optLPTokenAddresses.ETH,
            [TokenName.USDC]: optLPTokenAddresses.USDC,
            [TokenName.USDT]: optLPTokenAddresses.USDT,
        },
        [EndpointId.POLYGON_V2_MAINNET]: {
            [TokenName.USDC]: polygonLPTokenAddresses.USDC,
            [TokenName.USDT]: polygonLPTokenAddresses.USDT,
        },
        [EndpointId.SCROLL_V2_MAINNET]: {
            [TokenName.ETH]: scrollLPTokenAddresses.ETH,
            [TokenName.USDC]: scrollLPTokenAddresses.USDC,
        },
        [EndpointId.SEI_V2_MAINNET]: {
            [TokenName.USDC]: seiLPTokenAddresses.USDC,
            [TokenName.USDT]: seiLPTokenAddresses.USDT,
        },
        [EndpointId.SONEIUM_V2_MAINNET]: {
            [TokenName.ETH]: soneiumLPTokenAddresses.ETH,
            [TokenName.USDC]: soneiumLPTokenAddresses.USDC,
        },
        [EndpointId.SONIC_V2_MAINNET]: {
            [TokenName.USDC]: sonicLPTokenAddresses.USDC,
        },
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: {
            [TokenName.ETH]: zkConsensysLPTokenAddresses.ETH,
        },
    } satisfies Partial<Record<EndpointId, Partial<Record<TokenName, string>>>>
}

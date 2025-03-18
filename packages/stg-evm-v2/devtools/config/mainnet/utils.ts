import { withEid } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getContractsInChain, setsDifference } from '../utils'

export const onAbstract = withEid(EndpointId.ABSTRACT_V2_MAINNET)
export const onApe = withEid(EndpointId.APE_V2_MAINNET)
export const onArb = withEid(EndpointId.ARBITRUM_V2_MAINNET)
export const onAstar = withEid(EndpointId.ASTAR_V2_MAINNET)
export const onAurora = withEid(EndpointId.AURORA_V2_MAINNET)
export const onAvax = withEid(EndpointId.AVALANCHE_V2_MAINNET)
export const onBase = withEid(EndpointId.BASE_V2_MAINNET)
export const onBera = withEid(EndpointId.BERA_V2_MAINNET)
export const onBlast = withEid(EndpointId.BLAST_V2_MAINNET)
export const onBsc = withEid(EndpointId.BSC_V2_MAINNET)
export const onCodex = withEid(EndpointId.CODEX_V2_MAINNET)
export const onCoredao = withEid(EndpointId.COREDAO_V2_MAINNET)
export const onCronosevm = withEid(EndpointId.CRONOSEVM_V2_MAINNET)
export const onCronoskzevm = withEid(EndpointId.CRONOSZKEVM_V2_MAINNET)
export const onDegen = withEid(EndpointId.DEGEN_V2_MAINNET)
export const onEth = withEid(EndpointId.ETHEREUM_V2_MAINNET)
export const onEtherLink = withEid(EndpointId.ETHERLINK_V2_MAINNET)
export const onFantom = withEid(EndpointId.FANTOM_V2_MAINNET)
export const onFlare = withEid(EndpointId.FLARE_V2_MAINNET)
export const onFlow = withEid(EndpointId.FLOW_V2_MAINNET)
export const onFraxtal = withEid(EndpointId.FRAXTAL_V2_MAINNET)
export const onFuse = withEid(EndpointId.FUSE_V2_MAINNET)
export const onGlue = withEid(EndpointId.GLUE_V2_MAINNET)
export const onGnosis = withEid(EndpointId.GNOSIS_V2_MAINNET)
export const onGoat = withEid(EndpointId.GOAT_V2_MAINNET)
export const onGravity = withEid(EndpointId.GRAVITY_V2_MAINNET)
export const onHemi = withEid(EndpointId.HEMI_V2_MAINNET)
export const onInk = withEid(EndpointId.INK_V2_MAINNET)
export const onIota = withEid(EndpointId.IOTA_V2_MAINNET)
export const onIslander = withEid(EndpointId.ISLANDER_V2_MAINNET)
export const onKava = withEid(EndpointId.KAVA_V2_MAINNET)
export const onKlaytn = withEid(EndpointId.KLAYTN_V2_MAINNET)
export const onLightlink = withEid(EndpointId.LIGHTLINK_V2_MAINNET)
export const onManta = withEid(EndpointId.MANTA_V2_MAINNET)
export const onMantle = withEid(EndpointId.MANTLE_V2_MAINNET)
export const onMetis = withEid(EndpointId.METIS_V2_MAINNET)
export const onMode = withEid(EndpointId.MODE_V2_MAINNET)
export const onMoonbeam = withEid(EndpointId.MOONBEAM_V2_MAINNET)
export const onMoonRiver = withEid(EndpointId.MOONRIVER_V2_MAINNET)
export const onOpbnb = withEid(EndpointId.OPBNB_V2_MAINNET)
export const onOpt = withEid(EndpointId.OPTIMISM_V2_MAINNET)
export const onPeaq = withEid(EndpointId.PEAQ_V2_MAINNET)
export const onPlume = withEid(EndpointId.PLUME_V2_MAINNET)
export const onPolygon = withEid(EndpointId.POLYGON_V2_MAINNET)
export const onRarible = withEid(EndpointId.RARIBLE_V2_MAINNET)
export const onRootstock = withEid(EndpointId.ROOTSTOCK_V2_MAINNET)
export const onScroll = withEid(EndpointId.SCROLL_V2_MAINNET)
export const onSei = withEid(EndpointId.SEI_V2_MAINNET)
export const onShimmer = withEid(EndpointId.SHIMMER_V2_MAINNET)
export const onSoneium = withEid(EndpointId.SONEIUM_V2_MAINNET)
export const onSonic = withEid(EndpointId.SONIC_V2_MAINNET)
export const onStory = withEid(EndpointId.STORY_V2_MAINNET)
export const onSuperposition = withEid(EndpointId.SUPERPOSITION_V2_MAINNET)
export const onTaiko = withEid(EndpointId.TAIKO_V2_MAINNET)
export const onTelos = withEid(EndpointId.TELOS_V2_MAINNET)
export const onUnichain = withEid(EndpointId.UNICHAIN_V2_MAINNET)
export const onXchain = withEid(EndpointId.XCHAIN_V2_MAINNET)
export const onZkatana = withEid(EndpointId.ZKATANA_V2_MAINNET)
export const onZkConsensys = withEid(EndpointId.ZKCONSENSYS_V2_MAINNET)
export const onZkPolygon = withEid(EndpointId.ZKPOLYGON_V2_MAINNET)

// NOTE: because we need to load these upfront, ensure all rpcs are good even if we are not wiring those chains
export const chainEids = {
    'abstract-mainnet': EndpointId.ABSTRACT_V2_MAINNET,
    'ape-mainnet': EndpointId.APE_V2_MAINNET,
    'arbitrum-mainnet': EndpointId.ARBITRUM_V2_MAINNET,
    'astar-mainnet': EndpointId.ASTAR_V2_MAINNET,
    'aurora-mainnet': EndpointId.AURORA_V2_MAINNET,
    'avalanche-mainnet': EndpointId.AVALANCHE_V2_MAINNET,
    'base-mainnet': EndpointId.BASE_V2_MAINNET,
    'bera-mainnet': EndpointId.BERA_V2_MAINNET,
    'blast-mainnet': EndpointId.BLAST_V2_MAINNET,
    'bsc-mainnet': EndpointId.BSC_V2_MAINNET,
    'codex-mainnet': EndpointId.CODEX_V2_MAINNET,
    'coredao-mainnet': EndpointId.COREDAO_V2_MAINNET,
    'cronosevm-mainnet': EndpointId.CRONOSEVM_V2_MAINNET,
    'cronoskzevm-mainnet': EndpointId.CRONOSZKEVM_V2_MAINNET,
    'degen-mainnet': EndpointId.DEGEN_V2_MAINNET,
    // 'ebi-mainnet': EndpointId.EBI_V2_MAINNET, // should be removed due to ebi shutdown
    'ethereum-mainnet': EndpointId.ETHEREUM_V2_MAINNET,
    'etherlink-mainnet': EndpointId.ETHERLINK_V2_MAINNET,
    'fantom-mainnet': EndpointId.FANTOM_V2_MAINNET,
    'flare-mainnet': EndpointId.FLARE_V2_MAINNET,
    'flow-mainnet': EndpointId.FLOW_V2_MAINNET,
    'fraxtal-mainnet': EndpointId.FRAXTAL_V2_MAINNET,
    'fuse-mainnet': EndpointId.FUSE_V2_MAINNET,
    'glue-mainnet': EndpointId.GLUE_V2_MAINNET,
    'gnosis-mainnet': EndpointId.GNOSIS_V2_MAINNET,
    'goat-mainnet': EndpointId.GOAT_V2_MAINNET,
    'gravity-mainnet': EndpointId.GRAVITY_V2_MAINNET,
    'hemi-mainnet': EndpointId.HEMI_V2_MAINNET,
    'ink-mainnet': EndpointId.INK_V2_MAINNET,
    'iota-mainnet': EndpointId.IOTA_V2_MAINNET,
    'islander-mainnet': EndpointId.ISLANDER_V2_MAINNET,
    'kava-mainnet': EndpointId.KAVA_V2_MAINNET,
    'klaytn-mainnet': EndpointId.KLAYTN_V2_MAINNET,
    'lightlink-mainnet': EndpointId.LIGHTLINK_V2_MAINNET,
    'manta-mainnet': EndpointId.MANTA_V2_MAINNET,
    'mantle-mainnet': EndpointId.MANTLE_V2_MAINNET,
    'metis-mainnet': EndpointId.METIS_V2_MAINNET,
    'mode-mainnet': EndpointId.MODE_V2_MAINNET,
    'moonbeam-mainnet': EndpointId.MOONBEAM_V2_MAINNET,
    'moonriver-mainnet': EndpointId.MOONRIVER_V2_MAINNET,
    'opbnb-mainnet': EndpointId.OPBNB_V2_MAINNET,
    'optimism-mainnet': EndpointId.OPTIMISM_V2_MAINNET,
    'peaq-mainnet': EndpointId.PEAQ_V2_MAINNET,
    'plume-mainnet': EndpointId.PLUME_V2_MAINNET,
    'polygon-mainnet': EndpointId.POLYGON_V2_MAINNET,
    'rarible-mainnet': EndpointId.RARIBLE_V2_MAINNET,
    'rootstock-mainnet': EndpointId.ROOTSTOCK_V2_MAINNET,
    'scroll-mainnet': EndpointId.SCROLL_V2_MAINNET,
    'sei-mainnet': EndpointId.SEI_V2_MAINNET,
    'shimmer-mainnet': EndpointId.SHIMMER_V2_MAINNET,
    'soneium-mainnet': EndpointId.SONEIUM_V2_MAINNET,
    'sonic-mainnet': EndpointId.SONIC_V2_MAINNET,
    'story-mainnet': EndpointId.STORY_V2_MAINNET,
    'superposition-mainnet': EndpointId.SUPERPOSITION_V2_MAINNET,
    'taiko-mainnet': EndpointId.TAIKO_V2_MAINNET,
    'telos-mainnet': EndpointId.TELOS_V2_MAINNET,
    'unichain-mainnet': EndpointId.UNICHAIN_V2_MAINNET,
    'xchain-mainnet': EndpointId.XCHAIN_V2_MAINNET,
    'zkatana-mainnet': EndpointId.ZKATANA_V2_MAINNET,
    'zkconsensys-mainnet': EndpointId.ZKCONSENSYS_V2_MAINNET,
    'zkpolygon-mainnet': EndpointId.ZKPOLYGON_V2_MAINNET,
}

export const allSupportedChains = new Set(Object.keys(chainEids))

const excludedCreditMessagingChains = new Set([
    'astar-mainnet',
    'blast-mainnet',
    'etherlink-mainnet',
    'fantom-mainnet',
    'fraxtal-mainnet',
    'manta-mainnet',
    'mode-mainnet',
    'moonbeam-mainnet',
    'moonriver-mainnet',
    'opbnb-mainnet',
    'shimmer-mainnet',
    'zkatana-mainnet',
    'zkpolygon-mainnet',
    // Add chains that should be excluded from credit messaging
])

const excludedTokenMessagingChains = new Set([
    'astar-mainnet',
    'blast-mainnet',
    'etherlink-mainnet',
    'fantom-mainnet',
    'fraxtal-mainnet',
    'manta-mainnet',
    'mode-mainnet',
    'moonbeam-mainnet',
    'moonriver-mainnet',
    'opbnb-mainnet',
    'shimmer-mainnet',
    'zkatana-mainnet',
    'zkpolygon-mainnet',
    // Add chains that should be excluded from token messaging
])

export const validCreditMessagingChains = setsDifference(allSupportedChains, excludedCreditMessagingChains)
export const validTokenMessagingChains = setsDifference(allSupportedChains, excludedTokenMessagingChains)

export function isValidCreditMessagingChain(chain: string): boolean {
    return validCreditMessagingChains.has(chain)
}

export function isValidTokenMessagingChain(chain: string): boolean {
    return validTokenMessagingChains.has(chain)
}

export function isValidChain(chain: string): boolean {
    return allSupportedChains.has(chain)
}

export function getContracts(chains: string[] | null, contract: any, isValidChain: (chain: string) => boolean) {
    return getContractsInChain(chains, contract, isValidChain, chainEids)
}

import { withEid } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

export const onAbstract = withEid(EndpointId.ABSTRACT_V2_MAINNET)
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
export const onDegen = withEid(EndpointId.DEGEN_V2_MAINNET)
export const onEbi = withEid(EndpointId.EBI_V2_MAINNET)
export const onEth = withEid(EndpointId.ETHEREUM_V2_MAINNET)
export const onEtherLink = withEid(EndpointId.ETHERLINK_V2_MAINNET)
export const onFantom = withEid(EndpointId.FANTOM_V2_MAINNET)
export const onFlare = withEid(EndpointId.FLARE_V2_MAINNET)
export const onFlow = withEid(EndpointId.FLOW_V2_MAINNET)
export const onFraxtal = withEid(EndpointId.FRAXTAL_V2_MAINNET)
export const onFuse = withEid(EndpointId.FUSE_V2_MAINNET)
export const onGlue = withEid(EndpointId.GLUE_V2_MAINNET)
export const onGnosis = withEid(EndpointId.GNOSIS_V2_MAINNET)
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
export const onStory = withEid(EndpointId.STORY_V2_MAINNET)
export const onSuperposition = withEid(EndpointId.SUPERPOSITION_V2_MAINNET)
export const onTaiko = withEid(EndpointId.TAIKO_V2_MAINNET)
export const onXchain = withEid(EndpointId.XCHAIN_V2_MAINNET)
export const onZkatana = withEid(EndpointId.ZKATANA_V2_MAINNET)
export const onZkConsensys = withEid(EndpointId.ZKCONSENSYS_V2_MAINNET)
export const onZkPolygon = withEid(EndpointId.ZKPOLYGON_V2_MAINNET)

// NOTE: because we need to load these upfront, ensure all rpcs are good even if we are not wiring those chains
export const chainFunctions = {
    'abstract-mainnet': onAbstract,
    'arbitrum-mainnet': onArb,
    'astar-mainnet': onAstar,
    'aurora-mainnet': onAurora,
    'avalanche-mainnet': onAvax,
    'base-mainnet': onBase,
    'bera-mainnet': onBera,
    'blast-mainnet': onBlast,
    'bsc-mainnet': onBsc,
    'codex-mainnet': onCodex,
    'coredao-mainnet': onCoredao,
    'degen-mainnet': onDegen,
    'ebi-mainnet': onEbi,
    'ethereum-mainnet': onEth,
    'etherlink-mainnet': onEtherLink,
    'fantom-mainnet': onFantom,
    'flare-mainnet': onFlare,
    'flow-mainnet': onFlow,
    'fraxtal-mainnet': onFraxtal,
    'fuse-mainnet': onFuse,
    'glue-mainnet': onGlue,
    'gnosis-mainnet': onGnosis,
    'gravity-mainnet': onGravity,
    'hemi-mainnet': onHemi,
    'ink-mainnet': onInk,
    'iota-mainnet': onIota,
    'islander-mainnet': onIslander,
    'kava-mainnet': onKava,
    'klaytn-mainnet': onKlaytn,
    'lightlink-mainnet': onLightlink,
    'manta-mainnet': onManta,
    'mantle-mainnet': onMantle,
    'metis-mainnet': onMetis,
    'mode-mainnet': onMode,
    'moonbeam-mainnet': onMoonbeam,
    'moonriver-mainnet': onMoonRiver,
    'opbnb-mainnet': onOpbnb,
    'optimism-mainnet': onOpt,
    'peaq-mainnet': onPeaq,
    'plume-mainnet': onPlume,
    'polygon-mainnet': onPolygon,
    'rarible-mainnet': onRarible,
    'rootstock-mainnet': onRootstock,
    'scroll-mainnet': onScroll,
    'sei-mainnet': onSei,
    'shimmer-mainnet': onShimmer,
    'soneium-mainnet': onSoneium,
    'story-mainnet': onStory,
    'superposition-mainnet': onSuperposition,
    'taiko-mainnet': onTaiko,
    'xchain-mainnet': onXchain,
    'zkatana-mainnet': onZkatana,
    'zkconsensys-mainnet': onZkConsensys,
    'zkpolygon-mainnet': onZkPolygon,
}

export const validCreditMessagingChains = new Set([
    'abstract-mainnet',
    'arbitrum-mainnet',
    'aurora-mainnet',
    'avalanche-mainnet',
    'base-mainnet',
    'bera-mainnet',
    'bsc-mainnet',
    'codex-mainnet',
    'coredao-mainnet',
    'degen-mainnet',
    'ebi-mainnet',
    'ethereum-mainnet',
    'flare-mainnet',
    'flow-mainnet',
    'fuse-mainnet',
    'glue-mainnet',
    'gnosis-mainnet',
    'gravity-mainnet',
    'hemi-mainnet',
    'ink-mainnet',
    'iota-mainnet',
    'islander-mainnet',
    'kava-mainnet',
    'klaytn-mainnet',
    'lightlink-mainnet',
    'mantle-mainnet',
    'metis-mainnet',
    'optimism-mainnet',
    'peaq-mainnet',
    'plume-mainnet',
    'polygon-mainnet',
    'rarible-mainnet',
    'rootstock-mainnet',
    'scroll-mainnet',
    'sei-mainnet',
    'soneium-mainnet',
    'story-mainnet',
    'superposition-mainnet',
    'taiko-mainnet',
    'zkconsensys-mainnet',
    'xchain-mainnet',
    // Add other valid chains for credit messaging
])

export function isValidCreditMessagingChain(chain: string): boolean {
    return validCreditMessagingChains.has(chain)
}

export function getContracts(chains: string[] | null, contract: any, isValidChain: (chain: string) => boolean) {
    if (!chains || chains.length === 0) {
        // If chains is null or empty, include all valid contracts
        return Object.keys(chainFunctions)
            .filter(isValidChain)
            .map((chain) => chainFunctions[chain as keyof typeof chainFunctions](contract))
    }

    const invalidChains = chains.filter((chain) => !isValidChain(chain.trim()))
    if (invalidChains.length > 0) {
        throw new Error(`Invalid chains found: ${invalidChains.join(', ')}`)
    }

    return chains.map((chain) => chainFunctions[chain.trim() as keyof typeof chainFunctions](contract))
}

export function filterConnections(connections: any[], fromContracts: any[], toContracts: any[]) {
    const fromEids = new Set(fromContracts.map((contract: { eid: any }) => contract.eid))
    const toEids = new Set(toContracts.map((contract: { eid: any }) => contract.eid))

    return connections.filter((connection: { from: { eid: any }; to: { eid: any } }) => {
        return fromEids.has(connection.from.eid) && toEids.has(connection.to.eid)
    })
}

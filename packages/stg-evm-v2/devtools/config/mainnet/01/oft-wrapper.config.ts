import { OFTWrapperNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getSafeAddress } from '../../utils'
import {
    onArb,
    onAstar,
    onAurora,
    onAvax,
    onBase,
    onBlast,
    onBsc,
    onCodex,
    onDegen,
    onEbi,
    onEth,
    onEtherLink,
    onFantom,
    onFlare,
    onFraxtal,
    onFuse,
    onGravity,
    onHemi,
    onIota,
    onIslander,
    onKava,
    onKlaytn,
    onLightlink,
    onManta,
    onMantle,
    onMetis,
    onMode,
    onMoonRiver,
    onMoonbeam,
    onOpbnb,
    onOpt,
    onPeaq,
    onPlume,
    onPolygon,
    onRarible,
    onRootstock,
    onScroll,
    onSei,
    onShimmer,
    onSuperposition,
    onTaiko,
    onXchain,
    onZkConsensys,
    onZkPolygon,
    onZkatana,
} from '../utils'

const contract = { contractName: 'OFTWrapper' }

export default async (): Promise<OmniGraphHardhat<OFTWrapperNodeConfig, unknown>> => {
    const arbOftWrapper = onArb(contract)
    const astarOftWrapper = onAstar(contract)
    const auroraOftWrapper = onAurora(contract)
    const avaxOftWrapper = onAvax(contract)
    const baseOftWrapper = onBase(contract)
    const blastOftWrapper = onBlast(contract)
    const bscOftWrapper = onBsc(contract)
    const codexOftWrapper = onCodex(contract)
    const degenOftWrapper = onDegen(contract)
    const ebiOftWrapper = onEbi(contract)
    const ethOftWrapper = onEth(contract)
    const etherLinkOftWrapper = onEtherLink(contract)
    const fantomOftWrapper = onFantom(contract)
    const flareOftWrapper = onFlare(contract)
    const fraxtalOftWrapper = onFraxtal(contract)
    const fuseOftWrapper = onFuse(contract)
    const gravityOftWrapper = onGravity(contract)
    const hemiOftWrapper = onHemi(contract)
    const iotaOftWrapper = onIota(contract)
    const islanderOftWrapper = onIslander(contract)
    const kavaOftWrapper = onKava(contract)
    const klaytnOftWrapper = onKlaytn(contract)
    const lightlinkOftWrapper = onLightlink(contract)
    const mantaOftWrapper = onManta(contract)
    const mantleOftWrapper = onMantle(contract)
    const metisOftWrapper = onMetis(contract)
    const modeOftWrapper = onMode(contract)
    const moonbeamOftWrapper = onMoonbeam(contract)
    const moonRiverOftWrapper = onMoonRiver(contract)
    const opbnbOftWrapper = onOpbnb(contract)
    const optOftWrapper = onOpt(contract)
    const peaqOftWrapper = onPeaq(contract)
    const plumeOftWrapper = onPlume(contract)
    const polygonOftWrapper = onPolygon(contract)
    const raribleOftWrapper = onRarible(contract)
    const rootstockOftWrapper = onRootstock(contract)
    const scrollOftWrapper = onScroll(contract)
    const seiOftWrapper = onSei(contract)
    const shimmerOftWrapper = onShimmer(contract)
    const superpositionOftWrapper = onSuperposition(contract)
    const taikoOftWrapper = onTaiko(contract)
    const xchainOftWrapper = onXchain(contract)
    const zkatanaOftWrapper = onZkatana(contract)
    const zkConsensysOftWrapper = onZkConsensys(contract)
    const zkPolygonOftWrapper = onZkPolygon(contract)

    return {
        contracts: [
            {
                contract: arbOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ARBITRUM_V2_MAINNET),
                },
            },
            {
                contract: astarOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ASTAR_V2_MAINNET),
                },
            },
            {
                contract: auroraOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.AURORA_V2_MAINNET),
                },
            },
            {
                contract: avaxOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET),
                },
            },
            {
                contract: baseOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.BASE_V2_MAINNET),
                },
            },
            {
                contract: blastOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.BLAST_V2_MAINNET),
                },
            },
            {
                contract: bscOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.BSC_V2_MAINNET),
                },
            },
            {
                contract: codexOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.CODEX_V2_MAINNET),
                },
            },
            {
                contract: degenOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.DEGEN_V2_MAINNET),
                },
            },
            {
                contract: ebiOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.EBI_V2_MAINNET),
                },
            },
            {
                contract: ethOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET),
                },
            },
            {
                contract: etherLinkOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ETHERLINK_V2_MAINNET),
                },
            },
            {
                contract: fantomOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.FANTOM_V2_MAINNET),
                },
            },
            {
                contract: flareOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.FLARE_V2_MAINNET),
                },
            },
            {
                contract: fraxtalOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.FRAXTAL_V2_MAINNET),
                },
            },
            {
                contract: fuseOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.FUSE_V2_MAINNET),
                },
            },
            {
                contract: gravityOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                },
            },
            {
                contract: hemiOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.HEMI_V2_MAINNET),
                },
            },
            {
                contract: iotaOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.IOTA_V2_MAINNET),
                },
            },
            {
                contract: islanderOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ISLANDER_V2_MAINNET),
                },
            },
            {
                contract: kavaOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.KAVA_V2_MAINNET),
                },
            },
            {
                contract: klaytnOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.KLAYTN_V2_MAINNET),
                },
            },
            {
                contract: lightlinkOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET),
                },
            },
            {
                contract: mantaOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.MANTA_V2_MAINNET),
                },
            },
            {
                contract: mantleOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.MANTLE_V2_MAINNET),
                },
            },
            {
                contract: metisOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.METIS_V2_MAINNET),
                },
            },
            {
                contract: modeOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.MODE_V2_MAINNET),
                },
            },
            {
                contract: moonbeamOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.MOONBEAM_V2_MAINNET),
                },
            },
            {
                contract: moonRiverOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.MOONRIVER_V2_MAINNET),
                },
            },
            {
                contract: opbnbOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.OPBNB_V2_MAINNET),
                },
            },
            {
                contract: optOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.OPTIMISM_V2_MAINNET),
                },
            },
            {
                contract: peaqOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.PEAQ_V2_MAINNET),
                },
            },
            {
                contract: plumeOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.PLUME_V2_MAINNET),
                },
            },
            {
                contract: polygonOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.POLYGON_V2_MAINNET),
                },
            },
            {
                contract: raribleOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.RARIBLE_V2_MAINNET),
                },
            },
            {
                contract: rootstockOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ROOTSTOCK_V2_MAINNET),
                },
            },
            {
                contract: scrollOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.SCROLL_V2_MAINNET),
                },
            },
            {
                contract: seiOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.SEI_V2_MAINNET),
                },
            },
            {
                contract: shimmerOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.SHIMMER_V2_MAINNET),
                },
            },
            {
                contract: superpositionOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.SUPERPOSITION_V2_MAINNET),
                },
            },
            {
                contract: taikoOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.TAIKO_V2_MAINNET),
                },
            },
            {
                contract: xchainOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.XCHAIN_V2_MAINNET),
                },
            },
            {
                contract: zkatanaOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ZKATANA_V2_MAINNET),
                },
            },
            {
                contract: zkConsensysOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ZKCONSENSYS_V2_MAINNET),
                },
            },
            {
                contract: zkPolygonOftWrapper,
                config: {
                    owner: getSafeAddress(EndpointId.ZKPOLYGON_V2_MAINNET),
                },
            },
        ],
        connections: [],
    }
}

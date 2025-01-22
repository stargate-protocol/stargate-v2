import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
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
    onEth,
    onFlare,
    onFuse,
    onGlue,
    onGravity,
    onHemi,
    onInk,
    onIota,
    onIslander,
    onKlaytn,
    onLightlink,
    onMantle,
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
} from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.USDC
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const abstractFeeLibV1 = onAbstract(contract)
    const arbFeeLibV1 = onArb(contract)
    const auroraFeeLibV1 = onAurora(contract)
    const avaxFeeLibV1 = onAvax(contract)
    const baseFeeLibV1 = onBase(contract)
    const bscFeeLibV1 = onBsc(contract)
    const codexFeeLibV1 = onCodex(contract)
    const coredaoFeeLibV1 = onCoredao(contract)
    const degenFeeLibV1 = onDegen(contract)
    const ethFeeLibV1 = onEth(contract)
    const flareFeeLibV1 = onFlare(contract)
    const fuseFeeLibV1 = onFuse(contract)
    const glueFeeLibV1 = onGlue(contract)
    const gravityFeeLibV1 = onGravity(contract)
    const hemiFeeLibV1 = onHemi(contract)
    const inkFeeLibV1 = onInk(contract)
    const iotaFeeLibV1 = onIota(contract)
    const islanderFeeLibV1 = onIslander(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const lightlinkFeeLibV1 = onLightlink(contract)
    const mantleFeeLibV1 = onMantle(contract)
    const optFeeLibV1 = onOpt(contract)
    const peaqFeeLibV1 = onPeaq(contract)
    const plumeFeeLibV1 = onPlume(contract)
    const polygonFeeLibV1 = onPolygon(contract)
    const raribleFeeLibV1 = onRarible(contract)
    const rootstockFeeLibV1 = onRootstock(contract)
    const scrollFeeLibV1 = onScroll(contract)
    const seiFeeLibV1 = onSei(contract)
    const soneiumFeeLibV1 = onSoneium(contract)
    const superpositionFeeLibV1 = onSuperposition(contract)
    const taikoFeeLibV1 = onTaiko(contract)
    const xchainFeeLibV1 = onXchain(contract)

    return {
        contracts: [
            {
                contract: abstractFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: arbFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: avaxFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: auroraFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: baseFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: bscFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: codexFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: coredaoFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: degenFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: ethFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: flareFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: fuseFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: glueFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: gravityFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: hemiFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: inkFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: iotaFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: islanderFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: klaytnFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: lightlinkFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: mantleFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: optFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: peaqFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: plumeFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: polygonFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: raribleFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: rootstockFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: scrollFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: seiFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: soneiumFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: superpositionFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: taikoFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: xchainFeeLibV1,
                config: defaultNodeConfig,
            },
        ],
        connections: [],
    }
}

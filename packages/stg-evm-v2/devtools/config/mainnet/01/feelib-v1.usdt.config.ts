import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import {
    onAbstract,
    onArb,
    onAvax,
    onBsc,
    onCoredao,
    onDegen,
    onEbi,
    onEth,
    onFlare,
    onFuse,
    onGlue,
    onGravity,
    onHemi,
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
    onSei,
    onTaiko,
} from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.USDT
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const abstractFeeLibV1 = onAbstract(contract)
    const arbFeeLibV1 = onArb(contract)
    const avaxFeeLibV1 = onAvax(contract)
    const bscFeeLibV1 = onBsc(contract)
    const coredaoFeeLibV1 = onCoredao(contract)
    const degenFeeLibV1 = onDegen(contract)
    const ebiFeeLibV1 = onEbi(contract)
    const ethFeeLibV1 = onEth(contract)
    const flareFeeLibV1 = onFlare(contract)
    const fuseFeeLibV1 = onFuse(contract)
    const glueFeeLibV1 = onGlue(contract)
    const gravityFeeLibV1 = onGravity(contract)
    const hemiFeeLibV1 = onHemi(contract)
    const iotaFeeLibV1 = onIota(contract)
    const islanderFeeLibV1 = onIslander(contract)
    const kavaFeeLibV1 = onKava(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const lightlinkFeeLibV1 = onLightlink(contract)
    const mantleFeeLibV1 = onMantle(contract)
    const metisFeeLibV1 = onMetis(contract)
    const optFeeLibV1 = onOpt(contract)
    const peaqFeeLibV1 = onPeaq(contract)
    const plumeFeeLibV1 = onPlume(contract)
    const polygonFeeLibV1 = onPolygon(contract)
    const raribleFeeLibV1 = onRarible(contract)
    const rootstockFeeLibV1 = onRootstock(contract)
    const seiFeeLibV1 = onSei(contract)
    const taikoFeeLibV1 = onTaiko(contract)

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
                contract: bscFeeLibV1,
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
                contract: ebiFeeLibV1,
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
                contract: iotaFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: islanderFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: kavaFeeLibV1,
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
                contract: metisFeeLibV1,
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
                contract: seiFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: taikoFeeLibV1,
                config: defaultNodeConfig,
            },
        ],
        connections: [],
    }
}

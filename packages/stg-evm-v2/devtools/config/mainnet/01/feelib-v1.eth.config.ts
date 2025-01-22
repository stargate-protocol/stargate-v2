import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import {
    onAbstract,
    onArb,
    onBase,
    onDegen,
    onEth,
    onFlare,
    onFuse,
    onGlue,
    onGravity,
    onHemi,
    onIota,
    onIslander,
    onKlaytn,
    onLightlink,
    onMantle,
    onMetis,
    onOpt,
    onPeaq,
    onRootstock,
    onScroll,
    onSei,
    onSoneium,
    onZkConsensys,
} from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.ETH
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const abstractFeeLibV1 = onAbstract(contract)
    const arbFeeLibV1 = onArb(contract)
    const baseFeeLibV1 = onBase(contract)
    const degenFeeLibV1 = onDegen(contract)
    const ethFeeLibV1 = onEth(contract)
    const flareFeeLibV1 = onFlare(contract)
    const fuseFeeLibV1 = onFuse(contract)
    const glueFeeLibV1 = onGlue(contract)
    const gravityFeeLibV1 = onGravity(contract)
    const hemiFeeLibV1 = onHemi(contract)
    const iotaFeeLibV1 = onIota(contract)
    const islanderFeeLibV1 = onIslander(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const lightlinkFeeLibV1 = onLightlink(contract)
    const mantleFeeLibV1 = onMantle(contract)
    const metisFeeLibV1 = onMetis(contract)
    const optFeeLibV1 = onOpt(contract)
    const peaqFeeLibV1 = onPeaq(contract)
    const rootstockFeeLibV1 = onRootstock(contract)
    const scrollFeeLibV1 = onScroll(contract)
    const seiFeeLibV1 = onSei(contract)
    const soneiumFeeLibV1 = onSoneium(contract)
    const zkConsensysFeeLibV1 = onZkConsensys(contract)

    // TODO alphebatize
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
                contract: optFeeLibV1,
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
                contract: klaytnFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: lightlinkFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: metisFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: zkConsensysFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: mantleFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: baseFeeLibV1,
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
                contract: peaqFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: rootstockFeeLibV1,
                config: defaultNodeConfig,
            },
        ],
        connections: [],
    }
}

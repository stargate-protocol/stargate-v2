import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import {
    onArb,
    onAurora,
    onAvax,
    onBase,
    onBsc,
    onCoredao,
    onDegen,
    onEth,
    onFlare,
    onGravity,
    onIota,
    onKlaytn,
    onMantle,
    onOpt,
    onPolygon,
    onRarible,
    onScroll,
    onSei,
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

    const arbFeeLibV1 = onArb(contract)
    const auroraFeeLibV1 = onAurora(contract)
    const avaxFeeLibV1 = onAvax(contract)
    const baseFeeLibV1 = onBase(contract)
    const bscFeeLibV1 = onBsc(contract)
    const coredaoFeeLibV1 = onCoredao(contract)
    const degenFeeLibV1 = onDegen(contract)
    const ethFeeLibV1 = onEth(contract)
    const flareFeeLibV1 = onFlare(contract)
    const gravityFeeLibV1 = onGravity(contract)
    const iotaFeeLibV1 = onIota(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const mantleFeeLibV1 = onMantle(contract)
    const optFeeLibV1 = onOpt(contract)
    const polygonFeeLibV1 = onPolygon(contract)
    const raribleFeeLibV1 = onRarible(contract)
    const scrollFeeLibV1 = onScroll(contract)
    const seiFeeLibV1 = onSei(contract)
    const taikoFeeLibV1 = onTaiko(contract)
    const xchainFeeLibV1 = onXchain(contract)

    return {
        contracts: [
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
                contract: gravityFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: iotaFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: klaytnFeeLibV1,
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
                contract: polygonFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: raribleFeeLibV1,
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

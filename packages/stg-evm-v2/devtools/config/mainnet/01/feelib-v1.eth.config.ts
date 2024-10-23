import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import {
    onArb,
    onBase,
    onDegen,
    onEth,
    onFlare,
    onGravity,
    onIota,
    onKlaytn,
    onMantle,
    onMetis,
    onOpt,
    onScroll,
    onSei,
    onZkConsensys,
} from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.ETH
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const arbFeeLibV1 = onArb(contract)
    const baseFeeLibV1 = onBase(contract)
    const degenFeeLibV1 = onDegen(contract)
    const ethFeeLibV1 = onEth(contract)
    const flareFeeLibV1 = onFlare(contract)
    const gravityFeeLibV1 = onGravity(contract)
    const iotaFeeLibV1 = onIota(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const mantleFeeLibV1 = onMantle(contract)
    const metisFeeLibV1 = onMetis(contract)
    const optFeeLibV1 = onOpt(contract)
    const scrollFeeLibV1 = onScroll(contract)
    const seiFeeLibV1 = onSei(contract)
    const zkConsensysFeeLibV1 = onZkConsensys(contract)

    // TODO alphebatize
    return {
        contracts: [
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
                contract: optFeeLibV1,
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
        ],
        connections: [],
    }
}

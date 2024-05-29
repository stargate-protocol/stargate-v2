import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import { type FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '../../../src/feeLib_v1'
import { onArb, onBase, onEth, onKlaytn, onMantle, onMetis, onOpt, onScroll, onZkConsensys } from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.ETH
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const arbFeeLibV1 = onArb(contract)
    const baseFeeLibV1 = onBase(contract)
    const ethFeeLibV1 = onEth(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const mantleFeeLibV1 = onMantle(contract)
    const metisFeeLibV1 = onMetis(contract)
    const optFeeLibV1 = onOpt(contract)
    const scrollFeeLibV1 = onScroll(contract)
    const zkConsensysFeeLibV1 = onZkConsensys(contract)

    return {
        contracts: [
            {
                contract: arbFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: ethFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: optFeeLibV1,
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
        ],
        connections: [],
    }
}

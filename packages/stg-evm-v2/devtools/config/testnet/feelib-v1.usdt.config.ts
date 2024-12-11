import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { DEFAULT_PLANNER } from './constants'
import { onAbs, onArb, onBL3, onBsc, onEth, onKlaytn, onMantle, onOdyssey, onOpt } from './utils'
import { getFeeLibV1DeployName } from '../../../ops/util'

const tokenName = TokenName.USDT
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const bscFeeLibV1 = onBsc(contract)
    const ethFeeLibV1 = onEth(contract)
    const optFeeLibV1 = onOpt(contract)
    const arbFeeLibV1 = onArb(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const bl3FeeLibV1 = onBL3(contract)
    const odysseyFeeLibV1 = onOdyssey(contract)
    const mantleFeeLibV1 = onMantle(contract)
    const absFeeLibV1 = onAbs(contract)

    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    return {
        contracts: [
            {
                contract: ethFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: bscFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: optFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: arbFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: klaytnFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: bl3FeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: odysseyFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: mantleFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: absFeeLibV1,
                config: defaultNodeConfig,
            },
        ],
        connections: [],
    }
}

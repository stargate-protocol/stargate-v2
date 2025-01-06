import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../ops/util'

import { DEFAULT_PLANNER } from './constants'
import { onArb, onBL3, onEth, onKlaytn, onMantle, onOdyssey, onOpt } from './utils'

const tokenName = TokenName.ETH
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const ethFeeLibV1 = onEth(contract)
    const optFeeLibV1 = onOpt(contract)
    const arbFeeLibV1 = onArb(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const bl3FeeLibV1 = onBL3(contract)
    const odysseyFeeLibV1 = onOdyssey(contract)
    const mantleFeeLibV1 = onMantle(contract)

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
        ],
        connections: [],
    }
}

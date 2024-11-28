import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../ops/util'

import { DEFAULT_PLANNER } from './constants'
import { onArb, onBL3, onBsc, onEth, onKlaytn, onOpt } from './utils'

const tokenName = TokenName.USDT
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const bscFeeLibV1 = onBsc(contract)
    const ethFeeLibV1 = onEth(contract)
    const optFeeLibV1 = onOpt(contract)
    const arbFeeLibV1 = onArb(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const bl3FeeLibV1 = onBL3(contract)

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
        ],
        connections: [],
    }
}

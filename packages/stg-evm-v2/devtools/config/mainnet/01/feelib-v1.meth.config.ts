import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import { onEth, onMantle } from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.mETH
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const ethFeeLibV1 = onEth(contract)
    const mantleFeeLibV1 = onMantle(contract)

    return {
        contracts: [
            {
                contract: ethFeeLibV1,
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

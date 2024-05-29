import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import { type FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '../../../src/feeLib_v1'
import { onEth, onMetis } from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.METIS
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const ethFeeLibV1 = onEth(contract)
    const metisFeeLibV1 = onMetis(contract)

    return {
        contracts: [
            {
                contract: ethFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: metisFeeLibV1,
                config: defaultNodeConfig,
            },
        ],
        connections: [],
    }
}

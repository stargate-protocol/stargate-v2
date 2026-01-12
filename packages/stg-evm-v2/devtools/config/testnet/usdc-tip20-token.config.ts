import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import buildTip20TokenGraph from '../utils/tip20-token.config.utils'

import type { Tip20NodeConfig } from '@stargatefinance/stg-devtools-v2'

const tokenName = TokenName.USDC

export default async (): Promise<OmniGraphHardhat<Tip20NodeConfig, unknown>> => {
    return buildTip20TokenGraph(Stage.TESTNET, tokenName)
}

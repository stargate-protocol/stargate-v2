import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { CircleFiatTokenNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import buildCircleFiatTokenGraph from './circle-fiat-token.config.utils'

const tokenName = TokenName.USDC

export default async (): Promise<OmniGraphHardhat<CircleFiatTokenNodeConfig, unknown>> => {
    return buildCircleFiatTokenGraph(tokenName)
}

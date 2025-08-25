import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { CircleFiatTokenNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildCircleFiatTokenGraphMainnet } from '../utils'

const tokenName = TokenName.EURC

export default async (): Promise<OmniGraphHardhat<CircleFiatTokenNodeConfig, unknown>> => {
    return buildCircleFiatTokenGraphMainnet(tokenName)
}

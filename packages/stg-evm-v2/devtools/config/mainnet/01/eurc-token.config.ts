import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import buildCircleFiatTokenGraph from './circle-fiat-token.config.utils'

const tokenName = TokenName.EURC

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    return buildCircleFiatTokenGraph(tokenName)
}

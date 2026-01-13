import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildTip20TokenGraphMainnet } from '../utils'

import type { Tip20NodeConfig } from '@stargatefinance/stg-devtools-v2'

const tokenName = TokenName.EURC

export default async (): Promise<OmniGraphHardhat<Tip20NodeConfig, unknown>> => {
    return buildTip20TokenGraphMainnet(tokenName)
}

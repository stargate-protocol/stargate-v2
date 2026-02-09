import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildTIP20TokenGraphMainnet } from '../utils'

import type { TIP20NodeConfig } from '@stargatefinance/stg-devtools-v2'

const tokenName = TokenName.USDC

export default async (): Promise<OmniGraphHardhat<TIP20NodeConfig, unknown>> => {
    return buildTIP20TokenGraphMainnet(tokenName)
}

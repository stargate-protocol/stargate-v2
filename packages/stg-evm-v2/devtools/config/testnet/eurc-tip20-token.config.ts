import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildTIP20TokenGraphTestnet } from './utils'

import type { TIP20NodeConfig } from '@stargatefinance/stg-devtools-v2'

const tokenName = TokenName.EURC

export default async (): Promise<OmniGraphHardhat<TIP20NodeConfig, unknown>> => {
    return buildTIP20TokenGraphTestnet(tokenName)
}

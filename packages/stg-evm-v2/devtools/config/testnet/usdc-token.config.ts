import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildUsdcTokenGraphTestnet } from './utils'

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    return buildUsdcTokenGraphTestnet()
}

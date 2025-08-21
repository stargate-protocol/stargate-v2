import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildUsdcTokenGraphMainnet } from '../utils'

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    return buildUsdcTokenGraphMainnet()
}

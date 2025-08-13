import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import buildUsdcTokenGraph from '../../utils/usdc-token.config.utils'

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    return buildUsdcTokenGraph(Stage.MAINNET)
}

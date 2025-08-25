import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { buildUsdtTokenGraphMainnet } from '../utils'

export default async (): Promise<OmniGraphHardhat<OwnableNodeConfig, unknown>> => {
    return buildUsdtTokenGraphMainnet()
}

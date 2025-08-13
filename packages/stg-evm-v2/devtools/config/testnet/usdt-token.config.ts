import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import buildUsdtTokenGraph from '../utils/usdt-token.config.utils'

export default async (): Promise<OmniGraphHardhat<OwnableNodeConfig, unknown>> => {
    return buildUsdtTokenGraph(Stage.TESTNET)
}

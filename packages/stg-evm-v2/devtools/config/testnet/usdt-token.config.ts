import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

// For External USDT deployments,refernece packages/stg-evm-v2/devtools/config/mainnet/01/usdt-token.config.ts

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    return {
        contracts: [],
        connections: [],
    }
}

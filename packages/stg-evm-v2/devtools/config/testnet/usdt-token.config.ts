import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

// For External USDT deployments,refernece packages/stg-evm-v2/devtools/config/mainnet/01/usdt-token.config.ts

export default async (): Promise<OmniGraphHardhat<OwnableNodeConfig, unknown>> => {
    return {
        contracts: [],
        connections: [],
    }
}

import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateTokenMessagingConfig } from '../utils'

import { buildMessagingUnwireGraphTestnet } from './utils'

const contract = { contractName: 'TokenMessaging' as const }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    return buildMessagingUnwireGraphTestnet(contract, generateTokenMessagingConfig) as Promise<
        OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>
    >
}

import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateTokenMessagingConfig } from '../utils'

import { buildMessagingGraphTestnet } from './utils'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    return buildMessagingGraphTestnet(contract, 'TOKEN_MESSAGING', generateTokenMessagingConfig) as Promise<
        OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>
    >
}

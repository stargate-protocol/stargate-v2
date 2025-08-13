import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateTokenMessagingConfig } from '../../utils'

import buildMessagingGraph from './messaging.config.utils'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    return buildMessagingGraph(contract, 'TOKEN_MESSAGING', generateTokenMessagingConfig) as Promise<
        OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>
    >
}

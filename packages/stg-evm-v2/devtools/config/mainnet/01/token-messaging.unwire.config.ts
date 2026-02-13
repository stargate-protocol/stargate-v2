import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateTokenMessagingConfig } from '../../utils'
import { buildMessagingUnwireGraphMainnet } from '../utils'

const contract = { contractName: 'TokenMessaging' as const }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    return buildMessagingUnwireGraphMainnet(contract, generateTokenMessagingConfig) as Promise<
        OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>
    >
}

import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildAssetMessagingUnwireGraphMainnet } from '../utils'

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    return buildAssetMessagingUnwireGraphMainnet('TokenMessaging') as Promise<
        OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>
    >
}

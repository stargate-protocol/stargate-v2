import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildAssetMessagingUnwireGraphMainnet } from '../utils'

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    return buildAssetMessagingUnwireGraphMainnet('CreditMessaging') as Promise<
        OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>
    >
}

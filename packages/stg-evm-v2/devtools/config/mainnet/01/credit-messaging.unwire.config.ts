import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateCreditMessagingConfig } from '../../utils'
import { buildMessagingUnwireGraphMainnet } from '../utils'

const contract = { contractName: 'CreditMessaging' as const }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    return buildMessagingUnwireGraphMainnet(contract, generateCreditMessagingConfig) as Promise<
        OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>
    >
}

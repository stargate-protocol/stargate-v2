import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateCreditMessagingConfig } from '../../utils'
import { buildMessagingGraphMainnet } from '../utils'

const contract = { contractName: 'CreditMessaging' }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    return buildMessagingGraphMainnet(contract, 'CREDIT_MESSAGING', generateCreditMessagingConfig) as Promise<
        OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>
    >
}

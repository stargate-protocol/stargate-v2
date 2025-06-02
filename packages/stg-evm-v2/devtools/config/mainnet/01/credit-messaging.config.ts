import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateCreditMessagingConfig } from '../../utils'

import buildMessagingGraph from './messaging.config.helper'

const contract = { contractName: 'CreditMessaging' }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : []
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : []

    return buildMessagingGraph(
        contract,
        'CREDIT_MESSAGING',
        fromChains,
        toChains,
        generateCreditMessagingConfig
    ) as Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>>
}

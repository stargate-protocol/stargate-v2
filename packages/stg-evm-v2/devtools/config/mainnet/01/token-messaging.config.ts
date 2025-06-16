import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateTokenMessagingConfig } from '../../utils'

import buildMessagingGraph from './messaging.config.helper'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : []
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : []

    return buildMessagingGraph(
        contract,
        'TOKEN_MESSAGING',
        fromChains,
        toChains,
        generateTokenMessagingConfig
    ) as Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>>
}

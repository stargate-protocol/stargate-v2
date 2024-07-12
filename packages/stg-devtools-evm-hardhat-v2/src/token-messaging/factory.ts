import { TokenMessagingFactory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'
import { EndpointV2Factory } from '@layerzerolabs/protocol-devtools'
import { createEndpointV2Factory } from '@layerzerolabs/protocol-devtools-evm'

import { TokenMessaging } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `TokenMessaging` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {TokenMessagingFactory<TokenMessaging>}
 */
export const createTokenMessagingFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>,
    endpointFactory: EndpointV2Factory = createEndpointV2Factory(contractFactory)
): TokenMessagingFactory<TokenMessaging, TOmniPoint> =>
    pMemoize(async (point) => new TokenMessaging(await contractFactory(point), endpointFactory))

import { CreditMessagingFactory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'
import { EndpointV2Factory } from '@layerzerolabs/protocol-devtools'
import { createEndpointV2Factory } from '@layerzerolabs/protocol-devtools-evm'

import { CreditMessaging } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `CreditMessaging` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {StargateStakingFactory<StargateStaking>}
 */
export const createCreditMessagingFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>,
    endpointFactory: EndpointV2Factory = createEndpointV2Factory(contractFactory)
): CreditMessagingFactory<CreditMessaging, TOmniPoint> =>
    pMemoize(async (point) => new CreditMessaging(await contractFactory(point), endpointFactory))

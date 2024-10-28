import { TokenMessagingFactory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'

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
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>
): TokenMessagingFactory<TokenMessaging, TOmniPoint> =>
    pMemoize(async (point) => new TokenMessaging(await contractFactory(point)))

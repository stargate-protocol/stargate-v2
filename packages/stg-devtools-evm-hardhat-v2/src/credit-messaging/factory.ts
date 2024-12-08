import { CreditMessagingFactory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'

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
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>
): CreditMessagingFactory<CreditMessaging, TOmniPoint> =>
    pMemoize(async (point) => {
        const { contractName } = point as { contractName: string }

        return new CreditMessaging(await contractFactory(point), contractName)
    })

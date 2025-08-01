import { CircleFiatTokenFactory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'

import { CircleFiatToken } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `CircleFiatToken`(USDC/EURC) SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {CircleFiatTokenFactory<ICircleFiatToken>}
 */
export const createCircleFiatTokenFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>
): CircleFiatTokenFactory<CircleFiatToken, TOmniPoint> =>
    pMemoize(async (point) => new CircleFiatToken(await contractFactory(point)))

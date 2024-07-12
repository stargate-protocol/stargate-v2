import { FeeLibV1Factory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { FeeLibV1 } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `FeeLibV1` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {FeeLibV1Factory<FeeLibV1>}
 */
export const createFeeLibV1Factory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint>
): FeeLibV1Factory<FeeLibV1, TOmniPoint> => pMemoize(async (point) => new FeeLibV1(await contractFactory(point)))

import { TreasurerFactory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { Treasurer } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `Treasurer` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {TreasurerFactory<Treasurer>}
 */
export const createTreasurerFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint>
): TreasurerFactory<Treasurer, TOmniPoint> => pMemoize(async (point) => new Treasurer(await contractFactory(point)))

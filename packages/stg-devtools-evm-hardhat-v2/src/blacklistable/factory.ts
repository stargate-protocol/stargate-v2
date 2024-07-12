import { BlacklistableFactory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'

import { Blacklistable } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `Blacklistable` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {BlacklistableFactory<IBlacklistable>}
 */
export const createBlacklistableFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>
): BlacklistableFactory<Blacklistable, TOmniPoint> =>
    pMemoize(async (point) => new Blacklistable(await contractFactory(point)))

import { OFTWrapperFactory } from '@stargatefinance/stg-devtools-v2'
import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'

import { OFTWrapper } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `OFTWrapper` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {OFTWrapperFactory<OFTWrapper>}
 */
export const createOFTWrapperFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>
): OFTWrapperFactory<OFTWrapper, TOmniPoint> => pMemoize(async (point) => new OFTWrapper(await contractFactory(point)))

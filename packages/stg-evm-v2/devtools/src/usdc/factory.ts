import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'

import { USDC } from './sdk'
import { USDCFactory } from './types'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `USDC` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {USDCFactory<IUSDC>}
 */
export const createUSDCFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>
): USDCFactory<USDC, TOmniPoint> => pMemoize(async (point) => new USDC(await contractFactory(point)))

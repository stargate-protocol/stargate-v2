import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'

import { Tip20Token } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `Tip20Token` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`.
 * This mirrors the pattern used by other *factory.ts files: no direct `ethers` import.
 */
export const createTip20TokenFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>
) => pMemoize(async (point: TOmniPoint | OmniPoint) => new Tip20Token(await contractFactory(point)))

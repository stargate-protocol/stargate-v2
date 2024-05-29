import pMemoize from 'p-memoize'

import { OmniPoint } from '@layerzerolabs/devtools'

import { Staking } from './sdk'

import type { StakingFactory } from './types'
import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'

/**
 * Syntactic sugar that creates an instance of EVM `Staking` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {StargateStakingFactory<StargateStaking>}
 */
export const createStakingFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint | OmniPoint>
): StakingFactory<Staking, TOmniPoint> => pMemoize(async (point) => new Staking(await contractFactory(point)))

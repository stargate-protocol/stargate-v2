import pMemoize from 'p-memoize'

import { Asset } from './sdk'

import type { OmniContractFactory } from '@layerzerolabs/devtools-evm'
import type { AssetFactory } from '@stargatefinance/stg-devtools-v2'

/**
 * Syntactic sugar that creates an instance of EVM `Asset` SDK
 * based on an `OmniPoint` with help of an `OmniContractFactory`
 *
 * @param {OmniContractFactory} contractFactory
 * @returns {AssetFactory<Asset>}
 */
export const createAssetFactory = <TOmniPoint = never>(
    contractFactory: OmniContractFactory<TOmniPoint>
): AssetFactory<Asset, TOmniPoint> => pMemoize(async (point) => new Asset(await contractFactory(point)))

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
): AssetFactory<Asset, TOmniPoint> =>
    pMemoize(async (point) => {
        const { contractName } = point as { contractName: string }

        return new Asset(await contractFactory(point), contractName) // TODO should work once devtools PR is merged, published, and dependency is updated in this repo
    })

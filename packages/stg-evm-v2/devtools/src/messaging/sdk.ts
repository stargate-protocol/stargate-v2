import {
    AsyncRetriable,
    type OmniAddress,
    type OmniTransaction,
    UIntNumberSchema,
    ignoreZero,
} from '@layerzerolabs/devtools'
import { OApp } from '@layerzerolabs/ua-devtools-evm'

import { IMessaging } from './types'

import type { AssetId } from '@stargatefinance/stg-definitions-v2'

export abstract class Messaging extends OApp implements IMessaging {
    @AsyncRetriable()
    async getAsset(assetId: AssetId): Promise<OmniAddress | undefined> {
        // The contract refers to these as stargateImpls, but we reference them as 'assets'
        const asset = await this.contract.contract.stargateImpls(assetId)

        return ignoreZero(asset)
    }

    @AsyncRetriable()
    async getAssetId(asset: OmniAddress): Promise<AssetId> {
        return UIntNumberSchema.parse(await this.contract.contract.assetIds(asset))
    }

    async setAssetId(asset: OmniAddress, assetId: AssetId): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setAssetId', [asset, assetId])

        return {
            ...this.createTransaction(data),
            description: `Setting assetId for ${asset} to: ${assetId}`,
        }
    }

    @AsyncRetriable()
    async getMaxAssetId(): Promise<AssetId> {
        return UIntNumberSchema.parse(await this.contract.contract.maxAssetId())
    }

    async setMaxAssetId(maxAssetId: AssetId): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setMaxAssetId', [maxAssetId])

        return {
            ...this.createTransaction(data),
            description: `Setting max asset Id to: ${maxAssetId}`,
        }
    }
}

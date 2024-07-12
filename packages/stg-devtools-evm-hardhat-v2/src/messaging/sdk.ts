import { IMessaging } from '@stargatefinance/stg-devtools-v2'

import {
    AsyncRetriable,
    type OmniAddress,
    type OmniTransaction,
    UIntNumberSchema,
    ignoreZero,
} from '@layerzerolabs/devtools'
import { OApp } from '@layerzerolabs/ua-devtools-evm'

export abstract class Messaging extends OApp implements IMessaging {
    @AsyncRetriable()
    async getAsset(assetId: number): Promise<OmniAddress | undefined> {
        // The contract refers to these as stargateImpls, but we reference them as 'assets'
        const asset = await this.contract.contract.stargateImpls(assetId)

        return ignoreZero(asset)
    }

    @AsyncRetriable()
    async getAssetId(asset: OmniAddress): Promise<number> {
        return UIntNumberSchema.parse(await this.contract.contract.assetIds(asset))
    }

    async setAssetId(asset: OmniAddress, assetId: number): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setAssetId', [asset, assetId])

        return {
            ...this.createTransaction(data),
            description: `Setting assetId for ${asset} to: ${assetId}`,
        }
    }

    @AsyncRetriable()
    async getMaxAssetId(): Promise<number> {
        return UIntNumberSchema.parse(await this.contract.contract.maxAssetId())
    }

    async setMaxAssetId(maxAssetId: number): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setMaxAssetId', [maxAssetId])

        return {
            ...this.createTransaction(data),
            description: `Setting max asset Id to: ${maxAssetId}`,
        }
    }

    @AsyncRetriable()
    async getPlanner(): Promise<OmniAddress | undefined> {
        const planner = await this.contract.contract.planner()

        return ignoreZero(planner)
    }

    async setPlanner(planner: OmniAddress): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setPlanner', [planner])

        return {
            ...this.createTransaction(data),
            description: `Setting planner to: ${planner}`,
        }
    }
}

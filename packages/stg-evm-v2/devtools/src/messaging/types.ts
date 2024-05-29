import type { OmniAddress, OmniGraph, OmniTransaction } from '@layerzerolabs/devtools'
import type { IOApp, OAppEdgeConfig, OAppNodeConfig } from '@layerzerolabs/ua-devtools'
import type { AssetId } from '@stargatefinance/stg-definitions-v2'

export type MessagingAssetConfig = Record<OmniAddress, AssetId>

export interface MessagingNodeConfig extends OAppNodeConfig {
    maxAssetId?: AssetId
    assets?: MessagingAssetConfig
}

export type MessagingEdgeConfig = OAppEdgeConfig

export interface IMessaging extends IOApp {
    getAsset(assetId: AssetId): Promise<OmniAddress | undefined>
    getAssetId(asset: OmniAddress): Promise<AssetId>
    setAssetId(asset: OmniAddress, assetId: AssetId): Promise<OmniTransaction>
    getMaxAssetId(): Promise<AssetId>
    setMaxAssetId(assetId: AssetId): Promise<OmniTransaction>
}

export type MessagingOmniGraph = OmniGraph<MessagingNodeConfig, unknown>

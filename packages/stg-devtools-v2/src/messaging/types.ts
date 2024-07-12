import type { OmniAddress, OmniGraph, OmniTransaction } from '@layerzerolabs/devtools'
import type { IOApp, OAppEdgeConfig, OAppNodeConfig } from '@layerzerolabs/ua-devtools'

export type MessagingAssetConfig = Record<OmniAddress, number>

export interface MessagingNodeConfig extends OAppNodeConfig {
    planner?: OmniAddress
    maxAssetId?: number
    assets?: MessagingAssetConfig
}

export type MessagingEdgeConfig = OAppEdgeConfig

export interface IMessaging extends IOApp {
    getAsset(assetId: number): Promise<OmniAddress | undefined>
    getAssetId(asset: OmniAddress): Promise<number>
    setAssetId(asset: OmniAddress, assetId: number): Promise<OmniTransaction>
    getMaxAssetId(): Promise<number>
    setMaxAssetId(assetId: number): Promise<OmniTransaction>
    getPlanner(): Promise<OmniAddress | undefined>
    setPlanner(planner: OmniAddress): Promise<OmniTransaction>
}

export type MessagingOmniGraph = OmniGraph<MessagingNodeConfig, MessagingEdgeConfig>

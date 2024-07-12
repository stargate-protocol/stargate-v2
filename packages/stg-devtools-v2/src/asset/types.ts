import type {
    IOmniSDK,
    OmniAddress,
    OmniGraph,
    OmniPoint,
    OmniSDKFactory,
    OmniTransaction,
} from '@layerzerolabs/devtools'
import type { EndpointId } from '@layerzerolabs/lz-definitions'
import type { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'
import type { StargateType } from '@stargatefinance/stg-definitions-v2'

export interface AssetEdgeConfig {
    isOFT?: boolean
}

export interface AssetNodeConfig extends OwnableNodeConfig {
    assetId?: number
    addressConfig?: AddressConfig
}

export type AssetOmniGraph = OmniGraph<AssetNodeConfig, AssetEdgeConfig>

export type AssetFactory<TAsset extends IAsset = IAsset, TOmniPoint = OmniPoint> = OmniSDKFactory<TAsset, TOmniPoint>

export interface IAsset extends IOmniSDK, IOwnable {
    getAddressConfig(): Promise<AddressConfig>
    setAddressConfig(addressConfig: AddressConfig): Promise<OmniTransaction>
    hasAddressConfig(addressConfig: AddressConfig): Promise<boolean>

    isOFTPath(dstEid: EndpointId): Promise<boolean>
    setOFTPath(dstEid: EndpointId, isOft: boolean): Promise<OmniTransaction>

    isPaused(): Promise<boolean>
    setPaused(pause: boolean): Promise<OmniTransaction>

    getToken(): Promise<OmniAddress | undefined>
    getLPToken(): Promise<OmniAddress | undefined>

    getStargateType(): Promise<StargateType>
}

export interface AddressConfig {
    feeLib: OmniAddress
    planner: OmniAddress
    treasurer: OmniAddress
    tokenMessaging: OmniAddress
    creditMessaging: OmniAddress
    lzToken: OmniAddress
}

import type {
    IOmniSDK,
    OmniAddress,
    OmniGraph,
    OmniPoint,
    OmniSDKFactory,
    OmniTransaction,
} from '@layerzerolabs/devtools'
import type { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

export interface OFTWrapperNodeConfig extends OwnableNodeConfig {
    defaultBps?: bigint
    oftBps?: Partial<Record<OmniAddress, bigint>>
}

export type OFTWrapperOmniGraph = OmniGraph<OFTWrapperNodeConfig, unknown>

export type OFTWrapperFactory<TOFTWrapper extends IOFTWrapper = IOFTWrapper, TOmniPoint = OmniPoint> = OmniSDKFactory<
    TOFTWrapper,
    TOmniPoint
>

export interface IOFTWrapper extends IOmniSDK, IOwnable {
    getDefaultBps(): Promise<bigint>
    getOFTBps(token: OmniAddress): Promise<bigint>
    setDefaultBps(bps: bigint): Promise<OmniTransaction>
    setOFTBps(token: OmniAddress, bps: bigint): Promise<OmniTransaction>
}

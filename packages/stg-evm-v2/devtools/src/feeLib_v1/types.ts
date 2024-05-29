import { EndpointId } from '@layerzerolabs/lz-definitions'
import { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import type { IOmniSDK, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export type FeeLibV1NodeConfig = OwnableNodeConfig

export interface FeeLibV1EdgeConfig {
    feeConfig: FeeConfig
    paused: boolean
}

export type FeeLibV1OmniGraph = OmniGraph<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>

export type FeeLibV1Factory<TFeeLibV1 extends IFeeLibV1 = IFeeLibV1, TOmniPoint = OmniPoint> = OmniSDKFactory<
    TFeeLibV1,
    TOmniPoint
>

export interface IFeeLibV1 extends IOmniSDK, IOwnable {
    getFeeConfig(eid: EndpointId): Promise<FeeConfig>
    setFeeConfig(
        eid: EndpointId,
        zone1UpperBound: bigint,
        zone2UpperBound: bigint,
        zone1FeeMillionth: bigint,
        zone2FeeMillionth: bigint,
        zone3FeeMillionth: bigint,
        rewardMillionth: bigint
    ): Promise<OmniTransaction>
    getPaused(eid: EndpointId): Promise<boolean>
    setPaused(eid: EndpointId, paused: boolean): Promise<OmniTransaction>
}

export interface FeeConfig {
    zone1UpperBound: bigint
    zone2UpperBound: bigint
    zone1FeeMillionth: bigint // in millionth (1/1_000_000)
    zone2FeeMillionth: bigint // in millionth (1/1_000_000)
    zone3FeeMillionth: bigint // in millionth (1/1_000_000)
    rewardMillionth: bigint // in millionth (1/1_000_000)
}

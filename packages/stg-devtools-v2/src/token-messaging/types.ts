import { IMessaging, MessagingNodeConfig } from '../messaging'

import type {
    Bytes32,
    OmniAddress,
    OmniGraph,
    OmniPoint,
    OmniSDKFactory,
    OmniTransaction,
} from '@layerzerolabs/devtools'
import type { EndpointId } from '@layerzerolabs/lz-definitions'
import type { OAppEdgeConfig } from '@layerzerolabs/ua-devtools'

export type Fares = {
    busFare: bigint
    busAndNativeDropFare: bigint
}

export interface TokenMessagingGasLimits {
    gasLimit: bigint
    nativeDropGasLimit: bigint
}

export interface TokenMessagingEdgeConfig extends OAppEdgeConfig {
    maxPassengers?: number
    fares?: Fares
    gasLimit?: TokenMessagingGasLimits
    nativeDropAmount?: bigint
}

export type TokenMessagingAssetConfig = Record<OmniAddress, number>

export interface TokenMessagingNodeConfig extends MessagingNodeConfig {
    planner?: OmniAddress
}

export type TokenMessagingOmniGraph = OmniGraph<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>

export type TokenMessagingFactory<
    TTokenMessaging extends ITokenMessaging = ITokenMessaging,
    TOmniPoint = OmniPoint,
> = OmniSDKFactory<TTokenMessaging, TOmniPoint>

export interface ITokenMessaging extends IMessaging {
    getQueueCapacity(): Promise<bigint>
    getPassengerHash(dstEid: EndpointId, index: bigint): Promise<Bytes32 | undefined>
    getLastTickedOffset(dstEid: EndpointId): Promise<number>
    initializeBusQueueStorage(dstEids: EndpointId[], startSlot: bigint, endSlot: bigint): Promise<OmniTransaction>
    getMaxPassengers(dstEid: EndpointId): Promise<number>
    setMaxPassengers(dstEid: EndpointId, maxPassengers: number): Promise<OmniTransaction>
    getFares(dstEid: EndpointId): Promise<Fares>
    setFares(dstEid: EndpointId, fares: Fares): Promise<OmniTransaction>
    getGasLimit(dstEid: EndpointId): Promise<TokenMessagingGasLimits>
    setGasLimit(dstEid: EndpointId, gasLimit: TokenMessagingGasLimits): Promise<OmniTransaction>
    getNativeDropAmount(dstEid: EndpointId): Promise<bigint>
    setNativeDropAmount(dstEid: EndpointId, nativeDropAmount: bigint): Promise<OmniTransaction>
}

import { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import type {
    IOmniSDK,
    OmniAddress,
    OmniGraph,
    OmniPoint,
    OmniSDKFactory,
    OmniTransaction,
} from '@layerzerolabs/devtools'

export type PoolConfig = Record<OmniAddress, bigint>

export interface PoolNodeConfig extends OwnableNodeConfig {
    depositAmount: PoolConfig
    isNative?: boolean
}

export type PoolOmniGraph = OmniGraph<PoolNodeConfig, unknown>

export type PoolFactory<TPOOL extends IPool = IPool, TOmniPoint = OmniPoint> = OmniSDKFactory<TPOOL, TOmniPoint>

export interface IPool extends IOmniSDK, IOwnable {
    deposit(receiver: OmniAddress, amount: bigint): Promise<OmniTransaction>
}

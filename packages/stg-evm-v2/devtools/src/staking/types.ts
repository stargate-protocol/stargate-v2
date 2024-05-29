import type { Factory, IOmniSDK, OmniAddress, OmniGraph, OmniPoint, OmniTransaction } from '@layerzerolabs/devtools'
import type { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

export interface StakingNodeConfig extends OwnableNodeConfig {
    pools: StakingPoolConfig[]
}

export type StakingOmniGraph = OmniGraph<StakingNodeConfig, unknown>

export type StakingFactory<TStaking extends IStaking = IStaking, TOmniPoint = OmniPoint> = Factory<
    [TOmniPoint],
    TStaking
>

export interface IStaking extends IOmniSDK, IOwnable {
    getPool(token: OmniAddress): Promise<OmniAddress | undefined>
    setPool(token: OmniAddress, rewarder: OmniAddress): Promise<OmniTransaction>
}

export interface StakingPoolConfig {
    token: OmniAddress
    rewarder: OmniAddress
}

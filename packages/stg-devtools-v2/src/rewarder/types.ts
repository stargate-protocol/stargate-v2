import type {
    IOmniSDK,
    OmniAddress,
    OmniGraph,
    OmniPoint,
    OmniSDKFactory,
    OmniTransaction,
} from '@layerzerolabs/devtools'
import type { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

export type RewarderAllocationsConfig = Record<OmniAddress, Allocations>
export interface RewardConfig extends OwnableNodeConfig {
    rewardToken: OmniAddress
    amount: bigint
    start: number
    duration: number
}

export interface RewarderNodeConfig extends OwnableNodeConfig {
    allocations: RewarderAllocationsConfig // reward token -> Allocation
}

export type RewarderOmniGraph = OmniGraph<RewarderNodeConfig, unknown>

export interface RewarderRewardsNodeConfig extends OwnableNodeConfig {
    rewards: RewardConfig // reward config
}

export type RewarderRewardsOmniGraph = OmniGraph<RewarderRewardsNodeConfig, unknown>

export type RewarderFactory<TRewarder extends IRewarder = IRewarder, TOmniPoint = OmniPoint> = OmniSDKFactory<
    TRewarder,
    TOmniPoint
>

export interface IRewarder extends IOmniSDK, IOwnable {
    setReward(token: OmniAddress, amount: bigint, start: number, duration: number): Promise<OmniTransaction>
    getAllocationsByRewardToken(token: OmniAddress): Promise<Allocations>
    getAllocationsByStakingToken(token: OmniAddress): Promise<Allocations>
    setAllocPoints(token: OmniAddress, allocations: Record<OmniAddress, number>): Promise<OmniTransaction>
    getRewardDetails(token: OmniAddress): Promise<RewardDetails>
    getRewardTokens(): Promise<OmniAddress[]>
}

// token address -> allocation points
export type Allocations = Record<OmniAddress, number>

export interface RewardDetails {
    rewardPerSec: bigint
    totalAllocPoints: bigint
    start: number
    end: number
    exists: boolean
}

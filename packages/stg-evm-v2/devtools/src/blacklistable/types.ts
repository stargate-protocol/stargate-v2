import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export interface BlacklistableNodeConfig {
    blacklister?: OmniAddress
}

export type BlacklistableOmniGraph = OmniGraph<BlacklistableNodeConfig, unknown>

export type BlacklistableFactory<
    TBlacklistable extends IBlacklistable = IBlacklistable,
    TOmniPoint = OmniPoint,
> = OmniSDKFactory<TBlacklistable, TOmniPoint>

export interface IBlacklistable {
    getBlacklister(): Promise<OmniAddress>
    setBlacklister(blacklister: OmniAddress): Promise<OmniTransaction>
    isBlacklisted(address: OmniAddress): Promise<boolean>
    setBlacklisted(address: OmniAddress, blacklisted: boolean): Promise<OmniTransaction>
}

import type { Factory, IOmniSDK, OmniAddress, OmniGraph, OmniPoint, OmniTransaction } from '@layerzerolabs/devtools'
import type { IOwnable, OAppNodeConfig } from '@layerzerolabs/ua-devtools'

export interface TreasurerNodeConfig extends OAppNodeConfig {
    admin: OmniAddress
    assets: Record<OmniAddress, boolean>
}

export type TreasurerOmniGraph = OmniGraph<TreasurerNodeConfig, unknown>

export type TreasurerFactory<TTreasurer extends ITreasurer = ITreasurer, TOmniPoint = OmniPoint> = Factory<
    [TOmniPoint],
    TTreasurer
>

export interface ITreasurer extends IOmniSDK, IOwnable {
    getAdmin(): Promise<OmniAddress>
    setAdmin(admin: OmniAddress): Promise<OmniTransaction>
    getAsset(stargate: OmniAddress): Promise<boolean>
    setAsset(stargate: OmniAddress, managed: boolean): Promise<OmniTransaction>
}

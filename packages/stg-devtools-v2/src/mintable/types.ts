import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'
import type { OAppNodeConfig } from '@layerzerolabs/ua-devtools'

export interface MintableNodeConfig extends OAppNodeConfig {
    minters?: Record<OmniAddress, boolean>
}

export type MintableOmniGraph = OmniGraph<MintableNodeConfig, unknown>

export type MintableFactory<TMintable extends IMintable = IMintable, TOmniPoint = OmniPoint> = OmniSDKFactory<
    TMintable,
    TOmniPoint
>

export interface IMintable {
    isMinter(minter: OmniAddress): Promise<boolean>
    addMinter(minter: OmniAddress): Promise<OmniTransaction>
    removeMinter(minter: OmniAddress): Promise<OmniTransaction>
}

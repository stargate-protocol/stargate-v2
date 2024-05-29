import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export interface PausableNodeConfig {
    pauser?: OmniAddress
}

export type PausableOmniGraph = OmniGraph<PausableNodeConfig, unknown>

export type PausableFactory<TPausable extends IPausable = IPausable, TOmniPoint = OmniPoint> = OmniSDKFactory<
    TPausable,
    TOmniPoint
>

export interface IPausable {
    getPauser(): Promise<OmniAddress>
    setPauser(pauser: OmniAddress): Promise<OmniTransaction>
    isPaused(): Promise<boolean>
    setPaused(paused: boolean): Promise<OmniTransaction>
}

import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export interface RescuableNodeConfig {
    rescuer?: OmniAddress
}

export type RescuableOmniGraph = OmniGraph<RescuableNodeConfig, unknown>

export type RescuableFactory<TRescuable extends IRescuable = IRescuable, TOmniPoint = OmniPoint> = OmniSDKFactory<
    TRescuable,
    TOmniPoint
>

export interface IRescuable {
    getRescuer(): Promise<OmniAddress>
    setRescuer(rescuer: OmniAddress): Promise<OmniTransaction>
    rescueERC20(tokenContract: OmniAddress, to: OmniAddress, amount: bigint): Promise<OmniTransaction>
}

import { EndpointId } from '@layerzerolabs/lz-definitions'
import { OAppEdgeConfig, OAppNodeConfig } from '@layerzerolabs/ua-devtools'

import type { IMessaging, MessagingNodeConfig } from '../messaging'
import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export interface CreditMessagingEdgeConfig extends OAppEdgeConfig {
    gasLimit: bigint
}

export interface CreditMessagingNodeConfig extends OAppNodeConfig, MessagingNodeConfig {
    planner: OmniAddress
}

export type CreditMessagingOmniGraph = OmniGraph<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>

export type CreditMessagingFactory<
    TCreditMessaging extends ICreditMessaging = ICreditMessaging,
    TOmniPoint = OmniPoint,
> = OmniSDKFactory<TCreditMessaging, TOmniPoint>

export interface ICreditMessaging extends IMessaging {
    getPlanner(): Promise<OmniAddress | undefined>
    setPlanner(planner: OmniAddress): Promise<OmniTransaction>
    getGasLimit(eid: EndpointId): Promise<bigint>
    setGasLimit(eid: EndpointId, gasLimit: bigint): Promise<OmniTransaction>
}

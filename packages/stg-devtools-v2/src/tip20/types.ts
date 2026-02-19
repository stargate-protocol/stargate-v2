import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export interface TIP20NodeConfig {
    admin?: OmniAddress
    issuer?: OmniAddress
    pauser?: OmniAddress
    burnBlocked?: OmniAddress
}

export type TIP20OmniGraph = OmniGraph<TIP20NodeConfig, unknown>

export type TIP20Factory<TTIP20 extends ITIP20 = ITIP20, TOmniPoint = OmniPoint> = OmniSDKFactory<TTIP20, TOmniPoint>

export interface ITIP20 {
    getPauseRole?(): Promise<string>
    getUnpauseRole?(): Promise<string>
    getIssuerRole?(): Promise<string>
    getBurnBlockedRole?(): Promise<string>
    getDefaultAdminRole?(): Promise<string>
    hasRole?(account: OmniAddress, role: string): Promise<boolean>
    grantRole(roleName: string, role: string, account: OmniAddress): Promise<OmniTransaction>
    revokeRole(roleName: string, role: string, account: OmniAddress): Promise<OmniTransaction>
    isIssuer(account: OmniAddress): Promise<boolean>
    setIssuer(account: OmniAddress): Promise<OmniTransaction | undefined>
    setAdmin(admin: OmniAddress): Promise<OmniTransaction>
    renounceAdmin(): Promise<OmniTransaction | undefined>
    setPauser(pauser: OmniAddress): Promise<OmniTransaction | undefined>
    setUnpauser(pauser: OmniAddress): Promise<OmniTransaction | undefined>
    setBurnBlocked(burnBlocked: OmniAddress): Promise<OmniTransaction | undefined>
}

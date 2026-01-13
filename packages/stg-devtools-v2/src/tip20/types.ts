import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export interface Tip20NodeConfig {
    admin?: OmniAddress
    issuer?: OmniAddress
    pauser?: OmniAddress
    burnBlocked?: OmniAddress
}

export type Tip20OmniGraph = OmniGraph<Tip20NodeConfig, unknown>

export type Tip20Factory<TTip20 extends ITip20 = ITip20, TOmniPoint = OmniPoint> = OmniSDKFactory<TTip20, TOmniPoint>

export interface ITip20 {
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
    renounceAdmin(): Promise<OmniTransaction>
    setPauser(pauser: OmniAddress): Promise<OmniTransaction | undefined>
    setUnpauser(pauser: OmniAddress): Promise<OmniTransaction | undefined>
    setBurnBlocked(burnBlocked: OmniAddress): Promise<OmniTransaction | undefined>
}

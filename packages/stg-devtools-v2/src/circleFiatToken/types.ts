import { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { BlacklistableNodeConfig, IBlacklistable } from '../blacklistable'
import { IPausable, PausableNodeConfig } from '../pausable'
import { IRescuable, RescuableNodeConfig } from '../rescuable'

import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export interface CircleFiatTokenNodeConfig
    extends OwnableNodeConfig,
        PausableNodeConfig,
        RescuableNodeConfig,
        BlacklistableNodeConfig {
    masterMinter?: OmniAddress
    admin?: OmniAddress
    minters?: Record<OmniAddress, bigint>
}

export type CircleFiatTokenOmniGraph = OmniGraph<CircleFiatTokenNodeConfig, unknown>

export type CircleFiatTokenFactory<
    TCircleFiatToken extends ICircleFiatToken = ICircleFiatToken,
    TOmniPoint = OmniPoint,
> = OmniSDKFactory<TCircleFiatToken, TOmniPoint>

export interface ICircleFiatToken extends IOwnable, IPausable, IRescuable, IBlacklistable {
    isMinter(minter: OmniAddress): Promise<boolean>
    getMinterAllowance(minter: OmniAddress): Promise<bigint>
    configureMinter(minter: OmniAddress, allowance: bigint): Promise<OmniTransaction> // onlyMasterMinter
    removeMinter(minter: OmniAddress): Promise<OmniTransaction> // onlyMasterMinter
    getMasterMinter(): Promise<OmniAddress>
    setMasterMinter(masterMinter: OmniAddress): Promise<OmniTransaction> // onlyOwner
    getAdmin(): Promise<OmniAddress>
    setAdmin(admin: OmniAddress): Promise<OmniTransaction> // onlyAdmin
}

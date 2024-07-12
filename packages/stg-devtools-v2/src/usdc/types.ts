import { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { BlacklistableNodeConfig, IBlacklistable } from '../blacklistable'
import { IPausable, PausableNodeConfig } from '../pausable'
import { IRescuable, RescuableNodeConfig } from '../rescuable'

import type { OmniAddress, OmniGraph, OmniPoint, OmniSDKFactory, OmniTransaction } from '@layerzerolabs/devtools'

export interface USDCNodeConfig
    extends OwnableNodeConfig,
        PausableNodeConfig,
        RescuableNodeConfig,
        BlacklistableNodeConfig {
    masterMinter?: OmniAddress
    admin?: OmniAddress
    minters?: Record<OmniAddress, bigint>
}

export type USDCOmniGraph = OmniGraph<USDCNodeConfig, unknown>

export type USDCFactory<TUSDC extends IUSDC = IUSDC, TOmniPoint = OmniPoint> = OmniSDKFactory<TUSDC, TOmniPoint>

export interface IUSDC extends IOwnable, IPausable, IRescuable, IBlacklistable {
    isMinter(minter: OmniAddress): Promise<boolean>
    getMinterAllowance(minter: OmniAddress): Promise<bigint>
    configureMinter(minter: OmniAddress, allowance: bigint): Promise<OmniTransaction> // onlyMasterMinter
    removeMinter(minter: OmniAddress): Promise<OmniTransaction> // onlyMasterMinter
    getMasterMinter(): Promise<OmniAddress>
    setMasterMinter(masterMinter: OmniAddress): Promise<OmniTransaction> // onlyOwner
    getAdmin(): Promise<OmniAddress>
    setAdmin(admin: OmniAddress): Promise<OmniTransaction> // onlyAdmin
}

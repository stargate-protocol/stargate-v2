import { IOwnable, OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import type {
    IOmniSDK,
    OmniAddress,
    OmniGraph,
    OmniPoint,
    OmniSDKFactory,
    OmniTransaction,
} from '@layerzerolabs/devtools'

export type AllowanceConfig = Record<OmniAddress, Allowance>
export type MintConfig = Record<OmniAddress, bigint>

export interface ERC20NodeConfig extends OwnableNodeConfig {
    allowance?: AllowanceConfig
    mint?: MintConfig
}

export type ERC20OmniGraph = OmniGraph<ERC20NodeConfig, unknown>

export type ERC20Factory<TERC20 extends IERC20 = IERC20, TOmniPoint = OmniPoint> = OmniSDKFactory<TERC20, TOmniPoint>

export interface IERC20 extends IOmniSDK, IOwnable {
    approve(spender: OmniAddress, amount: bigint): Promise<OmniTransaction>
    // TODO Rename to getDecimals() to follow the getter convention
    decimals(): Promise<number>
    getName(): Promise<string>
    getSymbol(): Promise<string>
    getAllowance(owner: OmniAddress, spender: OmniAddress): Promise<bigint>
    mint(spender: OmniAddress, amount: bigint): Promise<OmniTransaction>
}

export type Allowance = Record<OmniAddress, bigint>

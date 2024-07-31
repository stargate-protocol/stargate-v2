import type { EndpointId } from '@layerzerolabs/lz-definitions'
import type { ContractNetworksConfig } from '@safe-global/protocol-kit/dist/src/types'

export enum StargateType {
    Pool = 'Pool',
    Oft = 'OFT',
    Native = 'Native',
}

export type AssetId = number

export enum TokenName {
    ETH = 'ETH',
    USDT = 'USDT',
    USDC = 'USDC',
    METIS = 'METIS',
    mETH = 'mETH',
}

/**
 * Network-agnostic token configuration
 */
export interface AssetConfig {
    assetId: AssetId
    name: string
    symbol: string
    sharedDecimals: number
    localDecimals?: number
    networks: AssetNetworksConfig
}

export type AssetNetworksConfig = Partial<Record<EndpointId, AssetNetworkConfig>>

/**
 * Network-specific token configuration
 */
export interface AssetNetworkConfig {
    name?: string
    symbol?: string
    address?: string
    type: StargateType
}

export type PermitNetworksConfig = Partial<Record<EndpointId, PermitNetworkConfig>>

export interface PermitNetworkConfig {
    address: string
}

export enum RewardTokenName {
    MOCK_A = 'MOCK_A',
    STG = 'STG',
    ARB = 'ARB',
    OP = 'OP',
    METIS = 'METIS',
    wKAVA = 'wKAVA',
    AURORA = 'AURORA',
    SEI = 'SEI',
}

export type RewardsConfig = Record<RewardTokenName, RewardsTokenConfig>

export interface RewardsTokenConfig {
    name: string
    networks: RewardsTokenNetworksConfig
}

export type RewardsTokenNetworksConfig = Partial<Record<EndpointId, RewardsTokenNetworkConfig>>

export interface RewardsTokenNetworkConfig {
    address?: string
}

export type NetworksConfig = Partial<Record<EndpointId, NetworkConfig>>

export interface SafeConfig {
    safeUrl: string
    safeAddress: string
    contractNetworks?: ContractNetworksConfig
}

export interface NetworkConfig {
    permitAddress?: string
    creditMessaging?: CreditMessagingNetworkConfig
    tokenMessaging?: TokenMessagingNetworkConfig
    safeConfig?: SafeConfig
}

export interface CreditMessagingNetworkConfig {
    creditGasLimit: bigint
    sendCreditGasLimit: bigint
    requiredDVNs?: string[]
    executor?: string
}

export interface TokenMessagingNetworkConfig {
    nativeDropAmount: bigint
    taxiGasLimit: bigint
    busGasLimit: bigint
    busRideGasLimit: bigint
    nativeDropGasLimit: bigint
    maxPassengerCount: number
    requiredDVNs?: string[]
    executor?: string
    queueCapacity: number
}

export interface OftWrapperConfig {
    bps: bigint
    callerBpsCap: bigint
    networks: Partial<Record<EndpointId, OftWrapperNetworkConfig>>
}

export interface OftWrapperNetworkConfig {
    bps?: bigint
    callerBpsCap?: bigint
}

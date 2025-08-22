import type { StargateTypes } from './constants'
import type { Provider } from '@ethersproject/providers'

export interface IToken {
    address: string
    decimals: number
    symbol: string
}

export interface V1FarmDefinition {
    address: string
    pid: number
    rewardToken: IToken
}

export interface FarmDefinition {
    lpStaking: V1FarmDefinition
    lpStakingTime: V1FarmDefinition
    stargateStaking: {
        address: string
        rewardTokens: IToken[]
    }
}

export type Farms = {
    [Type in keyof FarmDefinition]?: FarmDefinition[Type]
}

interface CommonStargatePoolInfo {
    stargateType: StargateTypes
    address: string
    token: IToken
}

export interface StargatePoolInfo extends CommonStargatePoolInfo {
    lpToken?: IToken
    farm?: Farms
}

export type StargatePoolInfoList = {
    [chainName: string]: StargatePoolInfo
}

export type StargatePoolConfig = {
    sharedDecimals: number
    poolInfo: StargatePoolInfoList
}

export type StargatePoolsConfig = {
    [assetId: string]: StargatePoolConfig
}

export interface StargatePoolConfigGetter {
    getPoolsConfig(): StargatePoolsConfig
    getPoolInfo(assetId: string, chainName: string): StargatePoolInfo
    getAssetIds(): string[]
}

export interface UriWithHeaders {
    uri: string
    headers?: { [header: string]: string }
}

export interface ProviderConfig {
    uris: string[] | UriWithHeaders[]
    quorum?: number
}

export interface ProviderConfigs {
    [chainName: string]: ProviderConfig
}

export interface BootstrapChainConfig {
    chainNames: string[]
    environment: string
    providers: {
        [chainName: string]: Provider
    }
    initialTokensOverrides?: {
        [chainName: string]: string | { [key: string]: string }
    }
}

import { Signer } from 'ethers'

import {
    CreditMessaging__factory,
    StargateOFT,
    StargateOFT__factory,
    StargatePool,
    StargatePoolNative,
    StargatePoolNative__factory,
    StargatePool__factory,
    StargateStaking__factory,
    TokenMessaging__factory,
} from './typechain'
import { createContractGetter } from './utils'

import type { Provider } from '@ethersproject/providers'

export * from './supportedChains'

const PACKAGE_NAME = '@stargatefinance/stg-evm-sdk-v2'

const resolvePackagePath = (address: string): { address: string } => {
    return require(address)
}

export type StargateContract = StargatePool | StargatePoolNative | StargateOFT

export enum StargateTypes {
    POOL = 'POOL',
    OFT = 'OFT',
    NATIVE = 'NATIVE',
}

// this is the enum used by the onchain contracts
export enum StargateContractType {
    POOL, // 0 in the contract
    OFT, // 1 in the contract
}

export const getStargateV2TokenMessagingContract = createContractGetter(
    TokenMessaging__factory,
    PACKAGE_NAME,
    'TokenMessaging',
    resolvePackagePath
)

export const getStargateV2CreditMessagingContract = (
    chainName: string,
    environment: string,
    provider: Signer | Provider
) => {
    const contractGetter = createContractGetter(
        CreditMessaging__factory,
        PACKAGE_NAME,
        'CreditMessaging',
        resolvePackagePath
    )
    return contractGetter(chainName, environment, provider)
}

export const getStargateV2StargateStakingContract = createContractGetter(
    StargateStaking__factory,
    PACKAGE_NAME,
    'StargateStaking',
    resolvePackagePath
)

export const connectStargateV2Contract = (
    provider: Signer | Provider,
    stargateType: StargateTypes,
    address: string
): StargatePool | StargatePoolNative | StargateOFT => {
    const contractMap = {
        [StargateTypes.OFT]: StargateOFT__factory,
        [StargateTypes.POOL]: StargatePool__factory,
        [StargateTypes.NATIVE]: StargatePoolNative__factory,
    } as const

    return contractMap[stargateType].connect(address, provider)
}

export * from './typechain'
export * from './utils'

export type { CreditsSentEvent } from './typechain/StargateBase'

export type { BusRodeEvent } from './typechain/messaging/TokenMessaging'

export type { OFTSentEvent } from './typechain/StargateOFT'

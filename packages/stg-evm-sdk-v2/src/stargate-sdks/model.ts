import { IToken, StargateTypes } from '../bootstrap-config'

interface RetryPolicy {
    backoffCoefficient?: number
    initialInterval?: string | number
    maximumAttempts?: number
    maximumInterval?: string | number
    nonRetryableErrorTypes?: string[]
}

export interface SdkMethod {
    methodName: string
    timeout?: string
    retry?: RetryPolicy
    access?: 'readonly' | 'readwrite' | 'denied'
    taskQueue?: string
}

export interface SdkDefinition {
    name: string
    methods: SdkMethod[]
}

export const STARGATEV2_SDK_DEFINITION: SdkDefinition = {
    methods: [
        // readonly
        { methodName: 'contractMetadata' },
        { methodName: 'farmMetadata' },
        { methodName: 'fetchPools' },
        { methodName: 'getPassengerOFTSentEvent' },
        { methodName: 'tvlOrSupply' },
        { methodName: 'getCreditsSentEvent' },
    ],
    name: 'StargateV2Sdk',
}

export interface LZOnchainEvent {
    chainName: string
    txHash: string
    blockHash: string
    blockNumber: number
    // Field only require for scan
    aptosScanTxHash?: string
}

export interface StargateV2OFTSentEvent {
    onChainEvent: LZOnchainEvent
    assetId: string
    srcEid: number
    dstEid: number
    dstChainName: string
    amountSentLD: string
    amountReceivedLD: string
    guid: string
}

export interface ContractMetadata {
    token: IToken
    stargateType: StargateTypes
    sharedDecimals: number
    name?: string
    lpToken?: IToken
}

export interface StargateV2Sdk {
    contractMetadata(address: string): Promise<ContractMetadata>
    farmMetadata(): Promise<
        {
            lpToken: string
            address: string
            rewardTokens: IToken[]
        }[]
    >
    fetchPools(): Promise<{
        assetIds: { [impl: string]: number }
        stargateImpls: { [asset: number]: string }
    }>
    tvl(pool: string): Promise<string>
    tvlOrSupply(pool: string): Promise<{
        tvlOrSupply: string
        blockNumber: number
        blockTimestamp: number
    }>
    getPassengerOFTSentEvent(args: {
        assetId: string
        txHash: string
        dstEid: number
        ticketId: string
    }): Promise<StargateV2OFTSentEvent>
    totalSupply(oft: string): Promise<string>
}

export type HydrateFn = <T = any>(event: any) => T

export interface ChainSdkFactory<T> {
    definition: SdkDefinition
    supportedChainNames?: string[]
    hydrateFn?: HydrateFn
    getSdk: (chainName: string) => T
}

export type MethodNames<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

export const latenciesToMonitor: MethodNames<StargateV2Sdk>[] = ['tvl', 'totalSupply']

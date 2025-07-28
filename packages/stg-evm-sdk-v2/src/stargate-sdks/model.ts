import { IToken, StargateTypes } from '../bootstrap-config'

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
}

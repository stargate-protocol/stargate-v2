import { IToken, StargateTypes } from '../bootstrap-config'

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

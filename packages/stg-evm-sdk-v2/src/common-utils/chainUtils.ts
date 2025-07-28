import {
    Chain,
    EndpointVersion,
    Stage,
    chainAndStageToEndpointId,
    getNetworkForChainId,
} from '@layerzerolabs/lz-definitions'

export const getChainName = (chainId: string | number | bigint): string => {
    return getNetworkForChainId(parseInt(chainId.toString()))?.chainName!
}

export const getChainIdForEndpointVersion = (
    chainName: string,
    environment: string,
    version: EndpointVersion
): string => {
    return chainAndStageToEndpointId(chainName as Chain, environment as Stage, version).toString()
}

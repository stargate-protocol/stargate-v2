import { deepCopy } from '@ethersproject/properties'
import { ethers } from 'ethers'

import { EndpointVersion, getNetworkForChainId } from '@layerzerolabs/lz-definitions'

import { getChainIdForEndpointVersion } from '../checkDeployment/utils'
import nativeCurrencyConfigs from '../configs/nativeCurrencyConfigs.json'
import { OFTSentEvent } from '../stargate-contracts'

import { StargateV2OFTSentEvent } from './model'

export const getChainName = (chainId: string | number | bigint): string => {
    return getNetworkForChainId(parseInt(chainId.toString()))?.chainName!
}

export const extractOFTSentEvent = (
    chainName: string,
    environment: string,
    event: OFTSentEvent,
    assetId: string
): StargateV2OFTSentEvent => {
    return {
        srcEid: parseInt(getChainIdForEndpointVersion(chainName, environment, EndpointVersion.V2)),
        assetId,
        dstEid: event.args.dstEid,
        dstChainName: getChainName(event.args.dstEid),
        amountSentLD: event.args.amountSentLD.toString(),
        amountReceivedLD: event.args.amountReceivedLD.toString(),
        guid: event.args.guid.toString(),
        onChainEvent: {
            chainName,
            blockHash: event.blockHash,
            blockNumber: event.blockNumber,
            txHash: event.transactionHash.toLowerCase(),
        },
    }
}

export const isOfEventType = (event: ethers.EventFilter, log: ethers.providers.Log): boolean => {
    return (
        (!event.topics || log.topics[0]?.toLowerCase() === (event.topics[0] as string).toLowerCase()) &&
        (!event.address || log.address.toLowerCase() === event.address.toLowerCase())
    )
}

export const convertLogToEvent = (log: ethers.providers.Log, contractInterface: ethers.utils.Interface) => {
    const event = deepCopy(log) as ethers.Event
    const logDescription = contractInterface.parseLog(log)
    event.event = logDescription.name
    event.eventSignature = logDescription.signature
    event.args = logDescription.args
    return event
}

export interface QueryFilter {
    etherFilter: ethers.EventFilter
    etherFragment: ethers.utils.EventFragment
}

export const getQueryFilter = <
    T extends string,
    Contract extends {
        filters: { [eventName in T]: () => ethers.EventFilter }
        interface: {
            getEvent: (eventName: T) => ethers.utils.EventFragment
        }
    },
>(
    contract: Contract,
    eventName: T
): QueryFilter => {
    return {
        etherFilter: contract.filters[eventName](),
        etherFragment: contract.interface.getEvent(eventName),
    }
}

export function getNativeCurrencyInfo(chainName: string): { decimals: number; symbol: string } {
    const config = nativeCurrencyConfigs[chainName as keyof typeof nativeCurrencyConfigs]

    if (!config || typeof config === 'string' || typeof config === 'number') {
        throw new Error(`Native currency configuration not found for chain: ${chainName}`)
    }

    return {
        decimals: config.decimals,
        symbol: config.symbol,
    }
}

export function getNativeCurrencyDecimals(chainName: string): number {
    return getNativeCurrencyInfo(chainName).decimals
}

export function getNativeCurrencySymbol(chainName: string): string {
    return getNativeCurrencyInfo(chainName).symbol
}

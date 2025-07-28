/**
 * Chain Utilities
 *
 * This module provides utilities for working with chain names, IDs, and environments
 * across the Stargate V2 ecosystem.
 */

import {
    Chain,
    EndpointVersion,
    Stage,
    chainAndStageToEndpointId,
    getNetworkForChainId,
} from '@layerzerolabs/lz-definitions'

/**
 * Converts a chain ID to chain name using LayerZero definitions
 * @param chainId - The chain ID as string, number, or bigint
 * @returns The chain name
 */
export const getChainName = (chainId: string | number | bigint): string => {
    return getNetworkForChainId(parseInt(chainId.toString()))?.chainName!
}

/**
 * Gets the endpoint ID for a specific chain and environment version
 * Note: This doesn't work for UlnVersion.V1
 * @param chainName - The name of the chain
 * @param environment - The environment (mainnet/testnet)
 * @param version - The endpoint version
 * @returns The endpoint ID as a string
 */
export const getChainIdForEndpointVersion = (
    chainName: string,
    environment: string,
    version: EndpointVersion
): string => {
    return chainAndStageToEndpointId(chainName as Chain, environment as Stage, version).toString()
}

/**
 * Converts environment string to Stage enum
 * @param environment - The environment string
 * @returns The corresponding Stage enum value
 * @throws Error if environment is not recognized
 */
export const environmentToStage = (environment: string): Stage => {
    switch (environment) {
        case 'mainnet':
            return Stage.MAINNET
        case 'testnet':
            return Stage.TESTNET
        default:
            throw new Error(`unrecognized environment ${environment}`)
    }
}

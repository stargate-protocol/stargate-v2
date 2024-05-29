import assert from 'assert'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { NETWORKS } from './constant'
import { NetworkConfig, TokenName } from './types'

/**
 * Helper function for asserting that a `string` is a valid `TokenName`
 *
 * @param {string} tokenName
 * @returns {boolean}
 */
export const isTokenName = (tokenName: string): tokenName is TokenName => tokenName in TokenName

/**
 * Network config accessor that checks for existence of a network config
 *
 * @param {EndpointId} endpointId
 * @returns {NetworkConfig}
 */
export const getNetworkConfig = (endpointId: EndpointId): NetworkConfig => {
    const config = NETWORKS[endpointId]

    return assert(config, `Missing network config for Endpoint ID ${endpointId}`), config
}

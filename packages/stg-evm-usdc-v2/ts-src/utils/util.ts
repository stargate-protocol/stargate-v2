import assert from 'assert'

import { ASSETS, AssetNetworkConfig, TokenName } from '@stargatefinance/stg-definitions-v2'

import { formatEid } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

/**
 * Helper utility that returns an asset network config
 * for a particular token on a particular network.
 *
 * If the config is not defined, `undefined` is returned
 *
 * @see {@link AssetNetworkConfig}
 *
 * @param {EndpointId} eid
 * @param {TokenName} tokenName
 * @returns {AssetNetworkConfig | undefined} Asset network config
 */
export const getAssetNetworkConfigMaybe = (eid: EndpointId, tokenName: TokenName): AssetNetworkConfig | undefined =>
    ASSETS[tokenName]?.networks?.[eid]

/**
 * Helper utility that returns an asset network config
 * for a particular token on a particular network.
 *
 * If the config is not defined, an AssertionError will be thrown
 *
 * @see {@link AssetNetworkConfig}
 *
 * @param {EndpointId} eid
 * @param {TokenName} tokenName
 * @returns {AssetNetworkConfig} Asset network config
 */
export const getAssetNetworkConfig = (eid: EndpointId, tokenName: TokenName): AssetNetworkConfig => {
    const config = getAssetNetworkConfigMaybe(eid, tokenName)

    return assert(config, `Missing asset network config for ${tokenName} for ${formatEid(eid)}`), config
}

/**
 * Helper utility for getting token name & symbol from the config.
 *
 * It will try to find the name & symbol on the asset network config,
 * then fallback to the defaults on the asset config.
 *
 * @param {EndpointId} eid
 * @param {TokenName} tokenName
 */
export const getTokenConfig = (
    eid: EndpointId,
    tokenName: TokenName
): { address?: string; name: string; symbol: string; sharedDecimals: number; localDecimals: number } => {
    const networkConfig = getAssetNetworkConfig(eid, tokenName)
    const config = ASSETS[tokenName]

    return {
        address: networkConfig.address,
        sharedDecimals: config.sharedDecimals,
        name: networkConfig?.name ?? config.name,
        symbol: networkConfig?.symbol ?? config.symbol,
        localDecimals: config.localDecimals ?? config.sharedDecimals, // default to sd if not defined
    }
}

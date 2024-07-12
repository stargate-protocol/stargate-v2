import assert from 'assert'

import {
    ASSETS,
    AssetNetworkConfig,
    REWARDS,
    RewardTokenName,
    StargateType,
    TokenName,
} from '@stargatefinance/stg-definitions-v2'
import { createAssetFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'

import { formatEid, tapError } from '@layerzerolabs/devtools'
import {
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger, printRecord } from '@layerzerolabs/io-devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getStargateDeployName } from '../../ops/util'

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

/**
 * Helper utility that returns an asset type (called `StargateType` in the contracts)
 * for a particular token on a particular network.
 *
 * If the asset network config is not defined, `undefined` is returned
 *
 * @see {@link StargateType}
 *
 * @param {EndpointId} eid
 * @param {TokenName} tokenName
 * @returns {StargateType | undefined} Asset type
 */
export const getAssetTypeMaybe = (eid: EndpointId, tokenName: TokenName): StargateType | undefined =>
    getAssetNetworkConfigMaybe(eid, tokenName)?.type

/**
 * Helper utility that returns an asset type (called `StargateType` in the contracts)
 * for a particular token on a particular network.
 *
 * If the asset network config is not defined, an AssertionError will be thrown
 *
 * @see {@link StargateType}
 *
 * @param {EndpointId} eid
 * @param {TokenName} tokenName
 * @returns {StargateType} Asset type
 */
export const getAssetType = (eid: EndpointId, tokenName: TokenName): StargateType =>
    getAssetNetworkConfig(eid, tokenName).type

/**
 * Tiny little helper that extracts the address field from an object.
 *
 * This is useful when grabbing e.g. a deployment from which we only want an address
 * and we don't want to write multiline awaits - we just pass `getAddress` to `.then()`:
 *
 * ```
 * const address = await hre.deployments.get('Contract').then(getAddress)
 * ```
 *
 * @template T
 * @param {{ address: T }}
 * @returns {T}
 */
export const getAddress = <T>({ address }: { address: T }): T => address

/**
 * Helper utility that gets a named account (and checks that it is defined)
 * based on the named account config in hardhat
 *
 * ```
 * const deployer = await hre.getNamedAccounts().then(getNamedAccount('deployer'))
 * ```
 *
 * @param {string} name
 */
export const getNamedAccount =
    (name: string) =>
    (accounts: Record<string, string>): string => (assert(accounts[name], `Missing account ${name}`), accounts[name])

/**
 * Helper utility to collect asset addresses based on their token names
 *
 * ```
 * const getAssetAddresses = createGetAssetAddresses()
 *
 * const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_TESTNET, TokenName.USDT, TokenName.BUSD)
 * ```
 *
 * @param {EndpointBasedFactory<HardhatRuntimeEnvironment>} [getHre] `HardhatRuntimeEnvironment` factory
 */
export const createGetAssetAddresses =
    (getHre = createGetHreByEid()) =>
    // We make the type of the token names argument bound to the return value
    //
    // That way if we only pass BUSD, the record will only have a BUSD key
    async <TTokenName extends TokenName = TokenName>(
        eid: EndpointId,
        tokenNames: TTokenName[] | readonly TTokenName[]
    ): Promise<Record<TTokenName, string>> => {
        // First we grab the HardhatRuntimeEnvironment for the eid
        const hre = await getHre(eid)

        // Then we collect all the token addresses based on their names
        const entries: [TTokenName, string][] = await Promise.all(
            tokenNames.map(async (tokenName) => [
                tokenName,
                await hre.deployments
                    .get(getStargateDeployName(tokenName, getAssetType(eid, tokenName)))
                    .then(getAddress),
            ])
        )

        // Finally we turn the result into an object keyed by TokenName
        return Object.fromEntries(entries) as Record<TTokenName, string>
    }

/**
 * Helper utility to collect reward token addresses based on their names
 *
 * ```
 * const getRewardTokenAddresses = createGetRewardTokenAddresses()
 *
 * const bscRewardTokenAddresses = await getRewardTokenAddresses(EndpointId.BSC_V2_TESTNET, RewardTokenName.MOCK_A)
 * ```
 *
 * @param {EndpointBasedFactory<HardhatRuntimeEnvironment>} [getHre] `HardhatRuntimeEnvironment` factory
 */
export const createGetRewardTokenAddresses =
    (getHre = createGetHreByEid()) =>
    // We make the type of the token names argument bound to the return value
    //
    // That way if we only pass BUSD, the record will only have a BUSD key
    async <TTokenName extends RewardTokenName = RewardTokenName>(
        eid: EndpointId,
        tokenNames: TTokenName[] | readonly TTokenName[]
    ): Promise<Record<TTokenName, string>> => {
        // First we grab the HardhatRuntimeEnvironment for the eid
        const hre = await getHre(eid)

        // Then we collect all the token addresses based on their names
        const entries: [TTokenName, string][] = await Promise.all(
            tokenNames.map(async (tokenName) => [
                tokenName,
                REWARDS[tokenName].networks[eid]?.address ??
                    (await hre.deployments.get(REWARDS[tokenName].name).then(getAddress)),
            ])
        )

        // Finally we turn the result into an object keyed by TokenName
        return Object.fromEntries(entries) as Record<TTokenName, string>
    }

/**
 * Helper utility to collect LP token addresses based on their names
 *
 * ```
 * const getLPTokenAddresses = createGetLPTokenAddresses()
 *
 * const bscLPTokenAddresses = await getLPTokenAddresses(EndpointId.BSC_V2_TESTNET, RewardTokenName.MOCK_A)
 * ```
 */
export const createGetLPTokenAddresses =
    (
        getHre = createGetHreByEid(),
        getAssetAddresses = createGetAssetAddresses(getHre),
        getAssetSdk = createAssetFactory(createConnectedContractFactory(createContractFactory(getHre)))
    ) =>
    // We make the type of the token names argument bound to the return value
    //
    // That way if we only pass BUSD, the record will only have a BUSD key
    async <TTokenName extends TokenName = TokenName>(
        eid: EndpointId,
        tokenNames: TTokenName[] | readonly TTokenName[]
    ): Promise<Record<TTokenName, string>> => {
        const logger = createModuleLogger(`createGetLPTokenAddresses for ${formatEid(eid)}`)

        logger.verbose(`Getting LP token addresses for ${tokenNames.join(', ')}`)

        // First we grab the asset addresses for the token names
        const assetAddresses = await tapError(
            () => getAssetAddresses(eid, tokenNames),
            (error) => (logger.error(`Failed to get asset addresses: ${error}`), undefined)
        )

        // Then we collect all the LP token addresses based on their names
        const entries: [TTokenName, string][] = await Promise.all(
            tokenNames.map(async (tokenName) => {
                logger.verbose(`Getting LP token address for token ${tokenName}`)

                // Now we grab the asset SDK. This allows us to benefit from retry functionality on the SDKs
                const assetSdk = await tapError(
                    () => getAssetSdk({ eid, address: assetAddresses[tokenName] }),
                    (error) => (logger.error(`Failed to get asset SDK: ${error}`), undefined)
                )

                // Now let's query the LP token address
                const lpTokenAddress = await tapError(
                    () => assetSdk.getLPToken(),
                    (error) => (logger.error(`Failed to get LP token address: ${error}`), undefined)
                )

                // And make sure the LP token is there (this is not the case for OFT assets)
                assert(lpTokenAddress != null, `Missing LP Token address for ${assetSdk.label} (token ${tokenName})`)

                return [tokenName, lpTokenAddress]
            })
        )

        // Now we turn the entries into an object
        const addresses = Object.fromEntries(entries) as Record<TTokenName, string>

        return (
            logger.verbose(`Got LP token addresses for ${tokenNames.join(', ')}:\n${printRecord(addresses)}`), addresses
        )
    }

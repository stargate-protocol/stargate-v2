import { ASSETS, StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { AddressConfig, AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { makeZeroAddress } from '@layerzerolabs/devtools-evm'
import {
    OmniEdgeHardhat,
    OmniNodeHardhat,
    OmniPointHardhat,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getFeeLibV1DeployName, getStargateDeployName } from '../ops/util'
import { getAddress, getAssetNetworkConfig, getAssetType, getNamedAccount } from '../ts-src/utils/util'

import { getSafeAddressMaybe } from './config/utils'

/**
 * Helper function for getting default `AddressConfig` objects for an `Asset`
 *
 * This function will take the address value from the local deployments
 * and the account addresses from the `namedAccounts` in hardhat.
 *
 * *This function will use the `deployer` named account as a planner*
 */
export const getDefaultAddressConfig =
    (tokenName: TokenName, overrides: Partial<AddressConfig> = {}) =>
    async (hre: HardhatRuntimeEnvironment): Promise<AddressConfig> => ({
        feeLib: overrides.feeLib ?? (await hre.deployments.get(getFeeLibV1DeployName(tokenName)).then(getAddress)),
        tokenMessaging: overrides.tokenMessaging ?? (await hre.deployments.get(`TokenMessaging`).then(getAddress)),
        creditMessaging: overrides.creditMessaging ?? (await hre.deployments.get(`CreditMessaging`).then(getAddress)),
        // The planner will be set to deployer by default
        // TODO do we want to override this with a "passed" planner that defaults to that if passed?
        planner: overrides.planner ?? (await hre.getNamedAccounts().then(getNamedAccount(`deployer`))),
        treasurer: overrides.treasurer ?? (await hre.deployments.get(`Treasurer`).then(getAddress)),
        lzToken: overrides.lzToken ?? makeZeroAddress(),
    })

export const createGetAssetOmniPoint =
    (tokenName: TokenName) =>
    (eid: EndpointId): OmniPointHardhat => ({
        eid,
        contractName: getStargateDeployName(tokenName, getAssetType(eid, tokenName)),
    })

export const createGetAssetNode =
    (
        tokenName: TokenName,
        defaultConfig: AssetNodeConfig = {},
        getHre = createGetHreByEid(),
        getDefaultAddressConfigForToken = getDefaultAddressConfig(tokenName)
    ) =>
    async (contract: OmniPointHardhat): Promise<OmniNodeHardhat<AssetNodeConfig>> => {
        const hre = await getHre(contract.eid)
        const owner = getSafeAddressMaybe(contract.eid)
        const assetConfig = ASSETS[tokenName]
        const config: AssetNodeConfig = {
            ...defaultConfig,
            owner,
            assetId: assetConfig.assetId,
            addressConfig: await getDefaultAddressConfigForToken(hre),
        }

        return { contract, config }
    }

export const createGetAssetEdge =
    (tokenName: TokenName) =>
    (from: OmniPointHardhat, to: OmniPointHardhat): OmniEdgeHardhat<AssetEdgeConfig> => {
        const assetNetworkConfig = getAssetNetworkConfig(to.eid, tokenName)
        const config: AssetEdgeConfig = {
            isOFT: assetNetworkConfig.type === StargateType.Oft,
        }

        return { from, to, config }
    }

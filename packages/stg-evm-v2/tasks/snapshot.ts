import { writeFileSync } from 'fs'

import { task } from 'hardhat/config'

import { OmniAddress, OmniPoint, formatEid, formatOmniPoint, tapError } from '@layerzerolabs/devtools'
import {
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
    types as devtoolsTypes,
    getEidsByNetworkName,
    getNetworkNameForEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { LogLevel, createLogger, createModuleLogger, printJson, setDefaultLogLevel } from '@layerzerolabs/io-devtools'
import { EndpointId, type Stage, endpointIdToStage, endpointIdToVersion } from '@layerzerolabs/lz-definitions'
import { ENDPOINT_IDS } from '@layerzerolabs/test-devtools'

import { AddressConfig, createAssetFactory } from '../devtools/src/asset'
import { createCreditMessagingFactory } from '../devtools/src/credit-messaging'
import { createERC20Factory } from '../devtools/src/erc20'

import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    stage: Stage
    out: string
    logLevel?: LogLevel
}

const action: ActionType<TaskArgs> = async ({ stage, out, logLevel = 'info' }, hre) => {
    // Set the logging level for any nested loggers
    setDefaultLogLevel(logLevel)

    // Create our own logger
    const logger = createLogger(logLevel)

    const eidsByNetworkName = Object.entries(getEidsByNetworkName(hre))
        // First filter the networks for which the eid is defined
        .flatMap(([networkName, eid]) => (eid == null ? [] : ([[networkName, eid]] as const)))
        // Then filter the networks on that stage
        .filter(([, eid]) => endpointIdToStage(eid) === stage)

    // We'll tell the user what we're going to do
    const networkNames = eidsByNetworkName.map(([networkName]) => networkName)
    logger.info(`Creating snapshot for ${networkNames.join(', ')}`)

    // We'll erase the outfile first
    //
    // This is not necessary per se, we'll just use it to check that the out file is writable
    logger.verbose(`Erasing outfile '${out}'`)
    await tapError(
        () => writeFileSync(out, JSON.stringify(null)),
        (error) => {
            logger.error(`Failed to erase the out file ${out}: ${error}`)
        }
    )

    // Create necessary utilities
    const getEnvironment = createGetHreByEid(hre)
    const collectCreditMessaging = createCollectCreditMessaging(getEnvironment)

    const entries = await Promise.all(
        eidsByNetworkName.map(async ([networkName, eid]) => {
            const creditMessaging = await collectCreditMessaging(eid)

            return [networkName, { eid, creditMessaging }] as const
        })
    )

    logger.info(`Collected snapshot information`)

    // Format the entries array into an object
    const data = Object.fromEntries(entries)

    // Store the snapshot
    logger.verbose(`Writing outfile '${out}'`)
    await tapError(
        () => writeFileSync(out, printJson(data)),
        (error) => {
            logger.error(`Failed to write the out file ${out}: ${error}`)
        }
    )
}

/**
 * Collects the information about `CreditMessaging` contracts on a particular network.
 *
 * This function will return `null` if there is no `CreditMessaging` deployed on a particular network.
 */
const createCollectCreditMessaging =
    (
        getEnvironment = createGetHreByEid(),
        contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment)),
        createSdk = createCreditMessagingFactory(contractFactory),
        collectAsset = createCollectAsset(getEnvironment, contractFactory)
    ) =>
    async (eid: EndpointId): Promise<CreditMessagingSnapshot | null> => {
        const logger = createModuleLogger(`CreditMessaging @ ${formatEid(eid)}`)

        logger.info(`Starting`)

        const env = await getEnvironment(eid)

        // We'll start with checking that we have a deployment on this network
        logger.verbose(`Getting a deployment`)
        const deployment = await env.deployments.getOrNull('CreditMessaging')
        if (deployment == null) {
            // If there is no deployment, we'll return null instead of throwing
            //
            // This covers the case of adding a network and running this script before deploying it
            return logger.info(`No deployment found, skipping`), null
        }

        logger.verbose(`Found the deployment: ${deployment.address}`)

        // We'll collect the information through an SDK (to use retry, schemas and all that)
        logger.verbose(`Creating an SDK`)
        const sdk = await createSdk({ address: deployment.address, eid })

        logger.verbose(`Collecting basic information`)
        const [owner, delegate, planner, maxAssetId] = await Promise.all([
            sdk.getOwner(),
            sdk.getDelegate(),
            sdk.getPlanner(),
            sdk.getMaxAssetId(),
        ])

        // Now we have to collect all the asset information
        //
        // The first step is to create an array of asset IDs from 1 to maxAssetId
        const assetIds = getPossibleAssetIds(maxAssetId)
        logger.verbose(`Collecting asset information for asset IDs ${assetIds.join(', ')}`)

        // Now we'll collect the asset information
        const assetEntries = await Promise.all(
            assetIds.map(async (assetId) => {
                logger.verbose(`Collecting asset information for asset ID ${assetId}`)

                const address = await sdk.getAsset(assetId)
                if (address == null) {
                    return logger.verbose(`No address found for asset ID ${assetId}`), [assetId, undefined] as const
                }

                return [assetId, await collectAsset({ eid, address })] as const
            })
        )
        const assets = Object.fromEntries(assetEntries)

        // Create the snapshot object just so that we can print it out
        const snapshot: CreditMessagingSnapshot = { owner, delegate, planner, maxAssetId, assets }

        logger.info(`Done`)
        logger.debug(`Collected:\n${printJson(snapshot)}`)

        return snapshot
    }

const createCollectAsset =
    (
        getEnvironment = createGetHreByEid(),
        contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment)),
        createSdk = createAssetFactory(contractFactory),
        collectERC20 = createCollectERC20(getEnvironment, contractFactory)
    ) =>
    async (point: OmniPoint): Promise<AssetSnapshot> => {
        const logger = createModuleLogger(`Asset @ ${formatOmniPoint(point)}`)

        logger.info(`Starting`)

        // We'll collect the information through an SDK (to use retry, schemas and all that)
        logger.verbose(`Creating an SDK`)
        const sdk = await createSdk(point)

        logger.verbose(`Collecting basic information`)
        const [owner, paused, addressConfig, lpTokenAddress] = await Promise.all([
            sdk.getOwner(),
            sdk.isPaused(),
            sdk.getAddressConfig(),
            sdk.getLPToken(),
        ])

        // Now we'll check the OFT paths
        //
        // Since we want to be independent from the config, we'll need to check all possible eids
        const peerEids = getPeerEids(point.eid)
        logger.verbose(`Collecting OFT path information for peer eids ${peerEids.map(formatEid).join(', ')}`)

        // This array will contain either empty tuples or a single element tuples with an OFTPath objects
        const oftPaths = await Promise.all(
            peerEids.map(
                async (dstEid): Promise<OFTPath[]> =>
                    (await sdk.isOFTPath(dstEid))
                        ? [{ eid: dstEid, networkName: getNetworkNameForEidMaybe(dstEid) }]
                        : []
            )
        )

        // If the asset has an LP token attached, we'll collect its information
        const lpToken =
            lpTokenAddress == null ? undefined : await collectERC20({ address: lpTokenAddress, eid: point.eid })

        // For now we'll collect nothing at all
        const snapshot: AssetSnapshot = {
            address: point.address,
            addressConfig,
            owner,
            paused,
            lpToken,
            oftPaths: oftPaths.flat(),
        }

        logger.info(`Done`)
        logger.debug(`Collected:\n${printJson(snapshot)}`)

        return snapshot
    }

const createCollectERC20 =
    (
        getEnvironment = createGetHreByEid(),
        contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment)),
        createSdk = createERC20Factory(contractFactory)
    ) =>
    async (point: OmniPoint): Promise<ERC20TokenSnapshot> => {
        const logger = createModuleLogger(`Asset @ ${formatOmniPoint(point)}`)

        logger.info(`Starting`)

        // We'll collect the information through an SDK (to use retry, schemas and all that)
        logger.verbose(`Creating an SDK`)
        const sdk = await createSdk({ ...point, contractName: 'ERC20' })

        logger.verbose(`Collecting basic information`)
        const [name, symbol, decimals] = await Promise.all([sdk.getName(), sdk.getSymbol(), sdk.decimals()])

        const snapshot: ERC20TokenSnapshot = { address: point.address, name, symbol, decimals }

        logger.info(`Done`)
        logger.debug(`Collected:\n${printJson(snapshot)}`)

        return snapshot
    }

/**
 * Helper utility to get all possible peer endpoint IDs for a particular endpoint ID
 *
 * @param {EndpointId} eid
 * @returns {EndpointId[]}
 */
const getPeerEids = (eid: EndpointId): EndpointId[] => {
    const stage = endpointIdToStage(eid)
    const version = endpointIdToVersion(eid)

    return ENDPOINT_IDS.filter((eid) => endpointIdToStage(eid) === stage && endpointIdToVersion(eid) === version)
}

/**
 * Helper utility that creates an array ranging from 1 to `maxAssetId`
 *
 * @param {number} maxAssetId
 * @returns {number[]}
 */
const getPossibleAssetIds = (maxAssetId: number): number[] => Array.from({ length: maxAssetId }).map((_, i) => i + 1)

/**
 * Helper utility that returnes `undefined` as a network name
 * if a given `eid` is not configured in hardhat config.
 *
 * This is useful when checking e.g. peers that might possibly
 * be set to networks that have been deleted or never set in hardhat config
 *
 * @param {EndpointId} eid
 * @returns {string | undefined}
 */
const getNetworkNameForEidMaybe = (eid: EndpointId): string | undefined => {
    try {
        return getNetworkNameForEid(eid)
    } catch {
        return undefined
    }
}

task('snapshot', 'Save stargate snapshot as a JSON file', action)
    .addParam('out', 'Path to the output JSON file', undefined, devtoolsTypes.string)
    .addParam('stage', 'Chain stage, one of mainnet, testnet, sandbox', undefined, devtoolsTypes.stage)
    .addParam(
        'logLevel',
        'Logging level. One of: error, warn, info, verbose, debug, silly',
        'info',
        devtoolsTypes.logLevel
    )

/**
 * Common properties shared between Token & Credit messaging
 */
interface MessagingSnapshot {
    owner?: OmniAddress
    delegate?: OmniAddress
    maxAssetId: number
    assets: Partial<Record<number, AssetSnapshot>>
}

/**
 * Describes `CreditMessaging` contract state
 */
interface CreditMessagingSnapshot extends MessagingSnapshot {
    planner?: OmniAddress
}

interface AssetSnapshot {
    owner?: OmniAddress
    paused: boolean
    address: OmniAddress
    addressConfig: AddressConfig
    lpToken?: ERC20TokenSnapshot
    oftPaths: OFTPath[]
}

interface ERC20TokenSnapshot {
    address: OmniAddress
    name: string
    symbol: string
    decimals: number
}

/**
 * Represents an OFT path for an Asset
 */
interface OFTPath {
    /**
     * Destination network eid
     */
    eid: EndpointId
    /**
     * Hardhat network name
     */
    networkName?: string
}

import { writeFileSync } from 'fs'

import { task } from 'hardhat/config'

import { OmniAddress, formatEid, tapError } from '@layerzerolabs/devtools'
import {
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
    types as devtoolsTypes,
    getEidsByNetworkName,
} from '@layerzerolabs/devtools-evm-hardhat'
import { LogLevel, createLogger, createModuleLogger, printJson, setDefaultLogLevel } from '@layerzerolabs/io-devtools'
import { EndpointId, type Stage, endpointIdToStage } from '@layerzerolabs/lz-definitions'

import { createCreditMessagingFactory } from '../devtools/src/credit-messaging'

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
        createSdk = createCreditMessagingFactory(contractFactory)
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

        logger.verbose(`Collecting information`)
        const [owner, delegate, planner] = await Promise.all([sdk.getOwner(), sdk.getDelegate(), sdk.getPlanner()])

        // Create the snapshot object just so that we can print it out
        const data: CreditMessagingSnapshot = { owner, delegate, planner }

        logger.info(`Done`)
        logger.debug(`Collected:\n${printJson(data)}`)

        return data
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
}

/**
 * Describes `CreditMessaging` contract state
 */
interface CreditMessagingSnapshot extends MessagingSnapshot {
    planner?: OmniAddress
}

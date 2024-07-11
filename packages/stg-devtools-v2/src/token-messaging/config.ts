import {
    type Configurator,
    OmniGraphBuilder,
    OmniTransaction,
    createConfigureEdges,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
    formatOmniVector,
    isZero,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger, printRecord } from '@layerzerolabs/io-devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { configureMessaging } from '../messaging/config'
import { formatNumberOfTransactions } from '../utils/logger'

import type { ITokenMessaging, TokenMessagingOmniGraph } from './types'

export type TokenMessagingConfigurator = Configurator<TokenMessagingOmniGraph, ITokenMessaging>

const createTokenMessagingLogger = () => createModuleLogger('TokenMessaging')
const withAsyncLogger = createWithAsyncLogger(createTokenMessagingLogger)

/**
 * Initializes bus storage for TokenMessaging.
 *
 * Intentionally left out of configureTokenMessaging since it could be quite resource-intensive
 * when it comes to RPC calls
 */
export const initializeBusQueueStorage: TokenMessagingConfigurator = withAsyncLogger(
    createConfigureNodes(
        withAsyncLogger(
            async ({ point }, sdk, graph) => {
                const dstEids = OmniGraphBuilder.fromGraph(graph)
                    .getEdgesFrom(point)
                    .map((edge) => edge.vector.to.eid)

                const queueCapacity = await sdk.getQueueCapacity()

                const txs: OmniTransaction[] = []
                // TODO Temporarily added to skip init for Ethereum
                if (point.eid === EndpointId.ETHEREUM_V2_MAINNET) {
                    return txs
                }

                for (const dstEid of dstEids) {
                    if (isZero(await sdk.getPassengerHash(dstEid, queueCapacity - 1n))) {
                        const halfQueueCapacity = queueCapacity / 2n
                        txs.push(await sdk.initializeBusQueueStorage([dstEid], 0n, halfQueueCapacity))
                        txs.push(await sdk.initializeBusQueueStorage([dstEid], halfQueueCapacity, queueCapacity))
                    }
                }

                return txs
            },
            {
                onStart: (logger, [{ point }]) =>
                    logger.verbose(`Initializing bus queue storage for ${formatOmniPoint(point)}`),
                onSuccess: (logger, [{ point }], transactions) =>
                    logger.verbose(
                        `Initialized bus queue storage for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                    ),
                onError: (logger, [{ point }], error) =>
                    logger.error(`Failed to initialize bus queue storage for ${formatOmniPoint(point)}: ${error}`),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Initializing bus queue storage`),
        onSuccess: (logger) => logger.info(`Initialized bus queue storage`),
    }
)

export const configureTokenMessagingGasLimit: TokenMessagingConfigurator = withAsyncLogger(
    createConfigureEdges(
        withAsyncLogger(
            async ({ vector: { to }, config: { gasLimit } }, sdk) => {
                if (gasLimit == null) return []

                const txs = []
                const currentGasLimit = await sdk.getGasLimit(to.eid)
                if (
                    currentGasLimit.gasLimit === gasLimit.gasLimit &&
                    currentGasLimit.nativeDropGasLimit === gasLimit.nativeDropGasLimit
                )
                    return []

                txs.push(await sdk.setGasLimit(to.eid, gasLimit))

                return txs
            },
            {
                onStart: (logger, [{ config, vector }]) =>
                    logger.verbose(`Configuring gas limit between ${formatOmniVector(vector)}: ${config.gasLimit}`),
                onSuccess: (logger, [{ vector }], transactions) =>
                    logger.verbose(
                        `Configured gas limit between ${formatOmniVector(vector)}: ${formatNumberOfTransactions(transactions)}`
                    ),
                onError: (logger, [{ vector }], error) =>
                    logger.error(`Failed to configure gas limit between ${formatOmniVector(vector)}: ${error}`),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Configuring gas limit`),
        onSuccess: (logger) => logger.info(`Configured gas limit`),
    }
)

export const configureMaxNumPassengers: TokenMessagingConfigurator = withAsyncLogger(
    createConfigureEdges(
        withAsyncLogger(
            async ({ vector: { to }, config }, sdk) => {
                if (config.maxPassengers == null) return []

                const maxPassengers = await sdk.getMaxPassengers(to.eid)

                const expectedMaxPassengers = config.maxPassengers ?? maxPassengers

                if (maxPassengers === expectedMaxPassengers) return []

                return [await sdk.setMaxPassengers(to.eid, expectedMaxPassengers)]
            },
            {
                onStart: (logger, [{ config, vector }]) =>
                    logger.verbose(
                        `Configuring maximum number of passengers between ${formatOmniVector(vector)}: ${config.maxPassengers}`
                    ),
                onSuccess: (logger, [{ vector }], transactions) =>
                    logger.verbose(
                        `Configured maximum number of passengers between ${formatOmniVector(vector)}: ${formatNumberOfTransactions(transactions)}`
                    ),
                onError: (logger, [{ vector }], error) =>
                    logger.error(
                        `Failed to configure maximum number of passengers between ${formatOmniVector(vector)}: ${error}`
                    ),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Configuring maximum number of passengers`),
        onSuccess: (logger) => logger.info(`Configured maximum number of passengers`),
    }
)

export const configureFares: TokenMessagingConfigurator = withAsyncLogger(
    createConfigureEdges(
        withAsyncLogger(
            async ({ vector: { to }, config }, sdk) => {
                if (config.fares == null) return []

                const fares = await sdk.getFares(to.eid)

                if (
                    fares.busFare === config.fares.busFare &&
                    fares.busAndNativeDropFare === config.fares.busAndNativeDropFare
                ) {
                    return []
                }

                return [await sdk.setFares(to.eid, config.fares)]
            },
            {
                onStart: (logger, [{ config, vector }]) =>
                    logger.verbose(
                        `Configuring fares between ${formatOmniVector(vector)}:\n${config.fares ? printRecord(config.fares) : undefined}`
                    ),
                onSuccess: (logger, [{ vector }], transactions) =>
                    logger.verbose(
                        `Configured fares between ${formatOmniVector(vector)}: ${formatNumberOfTransactions(transactions)}`
                    ),
                onError: (logger, [{ vector }], error) =>
                    logger.error(`Failed to configure fares between ${formatOmniVector(vector)}: ${error}`),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Configuring fares`),
        onSuccess: (logger) => logger.info(`Configured fares`),
    }
)

export const configureNativeDropAmount: TokenMessagingConfigurator = withAsyncLogger(
    createConfigureEdges(
        withAsyncLogger(
            async ({ vector: { to }, config }, sdk) => {
                if (config.nativeDropAmount == null) return []

                const nativeDropAmount = await sdk.getNativeDropAmount(to.eid)

                if (nativeDropAmount === config.nativeDropAmount) return []

                return [await sdk.setNativeDropAmount(to.eid, config.nativeDropAmount)]
            },
            {
                onStart: (logger, [{ config, vector }]) =>
                    logger.verbose(
                        `Configuring native drop amount between ${formatOmniVector(vector)}: ${config.nativeDropAmount}`
                    ),
                onSuccess: (logger, [{ vector }], transactions) =>
                    logger.verbose(
                        `Configured native drop amount between ${formatOmniVector(vector)}: ${formatNumberOfTransactions(transactions)}`
                    ),
                onError: (logger, [{ vector }], error) =>
                    logger.error(
                        `Failed to configure native drop amount between ${formatOmniVector(vector)}: ${error}`
                    ),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Configuring native drop amount`),
        onSuccess: (logger) => logger.info(`Configured native drop amount`),
    }
)

export const configureTokenMessaging: TokenMessagingConfigurator = withAsyncLogger(
    createConfigureMultiple(
        configureMessaging,
        configureTokenMessagingGasLimit,
        configureMaxNumPassengers,
        configureFares,
        configureNativeDropAmount
    ),
    {
        onStart: (logger) => logger.info(`Configuring`),
        onSuccess: (logger) => logger.info(`Configured`),
        onError: (logger, _, error) => logger.error(`Failed to configure: ${error}`),
    }
)

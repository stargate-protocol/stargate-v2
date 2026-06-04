import {
    type Configurator,
    type OmniTransaction,
    areBytes32Equal,
    createConfigureEdges,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
    formatOmniVector,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'
import { configureOApp } from '@layerzerolabs/ua-devtools'

import { formatNumberOfTransactions } from '../utils/logger'

import { IMessaging, MessagingOmniGraph } from './types'

export type MessagingConfigurator = Configurator<MessagingOmniGraph, IMessaging>

const createMessagingLogger = () => createModuleLogger('Messaging')
const withAsyncLogger = createWithAsyncLogger(createMessagingLogger)

export const configurePlanner: MessagingConfigurator = withAsyncLogger(
    createConfigureNodes(
        withAsyncLogger(
            async ({ config }, sdk) => {
                if (config.planner == null) return []

                const planner = await sdk.getPlanner()
                if (areBytes32Equal(planner, config.planner)) return []

                return [await sdk.setPlanner(config.planner)]
            },
            {
                onStart: (logger, [{ config, point }]) =>
                    logger.verbose(`Configuring planner for ${formatOmniPoint(point)}: ${config.planner}`),
                onSuccess: (logger, [{ config, point }], transactions) =>
                    logger.verbose(
                        `Configured planner for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}: ${config.planner}`
                    ),
                onError: (logger, [{ point }], error) =>
                    logger.error(`Failed to configure planner for ${formatOmniPoint(point)}: ${error}`),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Configuring planner`),
        onSuccess: (logger) => logger.info(`Configured planner`),
    }
)

export const configureMaxAssetId: MessagingConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    if (config.maxAssetId == null) return

    const maxAssetId = await sdk.getMaxAssetId()
    if (maxAssetId === config.maxAssetId) return []

    return [await sdk.setMaxAssetId(config.maxAssetId)]
})

export const configureAssets: MessagingConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    if (config.assets == null) return

    const txs: OmniTransaction[] = []
    await Promise.all(
        Object.entries(config.assets).map(async ([address, assetId]) => {
            const currentAssetId = await sdk.getAssetId(address)

            if (currentAssetId === assetId) return

            txs.push(await sdk.setAssetId(address, assetId))
        })
    )

    return txs
})

export const configureMessaging: MessagingConfigurator = withAsyncLogger(
    createConfigureMultiple(configurePlanner, configureMaxAssetId, configureAssets, configureOApp),
    {
        onStart: (logger) => logger.info(`Configuring`),
        onSuccess: (logger) => logger.info(`Configured`),
        onError: (logger, _, error) => logger.error(`Failed to configure: ${error}`),
    }
)

/**
 * Unpeers edges by calling setPeer(eid, null) = setPeer(eid, bytes32(0)).
 *
 * Intended to be combined with configureTokenMessaging / configureCreditMessaging via
 * createConfigureMultiple — do NOT combine with configureOAppPeers (which only sets peers
 * and would conflict with unpeering intent).
 *
 * Use with the unwire graph config to selectively remove peers between chains.
 */
export const configureUnpeerEdges: MessagingConfigurator = withAsyncLogger(
    createConfigureEdges(
        withAsyncLogger(
            async ({ vector: { to } }, sdk) => {
                // hasPeer(eid, null) returns true when the peer is already bytes32(0)
                const alreadyUnpeered = await sdk.hasPeer(to.eid, null)
                if (alreadyUnpeered) return []

                return [await sdk.setPeer(to.eid, null)]
            },
            {
                onStart: (logger, [{ vector }]) => logger.verbose(`Checking peer for ${formatOmniVector(vector)}`),
                onSuccess: (logger, [{ vector }], transactions) =>
                    logger.verbose(
                        `Checked peer for ${formatOmniVector(vector)}: ${formatNumberOfTransactions(transactions)}`
                    ),
                onError: (logger, [{ vector }], error) =>
                    logger.error(`Failed to unpeer ${formatOmniVector(vector)}: ${error}`),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Unpeering edges`),
        onSuccess: (logger) => logger.info(`Unpeered edges`),
        onError: (logger, _, error) => logger.error(`Failed to unpeer edges: ${error}`),
    }
)

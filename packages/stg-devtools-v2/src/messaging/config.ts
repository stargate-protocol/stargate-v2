import {
    type Configurator,
    type OmniTransaction,
    areBytes32Equal,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'
import { configureOApp } from '@layerzerolabs/ua-devtools'

import { formatNumberOfTransactions } from '../utils/logger'

import { IMessaging, MessagingOmniGraph } from './types'

export type MessagingConfigurator = Configurator<MessagingOmniGraph, IMessaging>

const createMessagingLogger = () => createModuleLogger('TokenMessaging')
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

import {
    type Configurator,
    createConfigureEdges,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
    formatOmniVector,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger, printJson } from '@layerzerolabs/io-devtools'

import { formatNumberOfTransactions } from '../utils/logger'

import type { AssetOmniGraph, IAsset } from './types'

export type AssetConfigurator = Configurator<AssetOmniGraph, IAsset>

const createAssetLogger = () => createModuleLogger('Asset')
const withAsyncLogger = createWithAsyncLogger(createAssetLogger)

export const configureOFTPath: AssetConfigurator = withAsyncLogger(
    createConfigureEdges(
        withAsyncLogger(
            async ({ vector: { to }, config }, sdk) => {
                if (config.isOFT == null) return []

                const isOFT = await sdk.isOFTPath(to.eid)

                if (isOFT === config.isOFT) return []

                return [await sdk.setOFTPath(to.eid, config.isOFT)]
            },
            {
                onStart: (logger, [{ config, vector }]) =>
                    logger.verbose(`Configuring oftPath between ${formatOmniVector(vector)}: ${config.isOFT}`),
                onSuccess: (logger, [{ vector }], transactions) =>
                    logger.verbose(
                        `Configured oftPath between ${formatOmniVector(vector)}: ${formatNumberOfTransactions(transactions)}`
                    ),
                onError: (logger, [{ vector }], error) =>
                    logger.error(`Failed to configure oftPath between ${formatOmniVector(vector)}: ${error}`),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Configuring oftPath`),
        onSuccess: (logger) => logger.info(`Configured oftPath`),
    }
)

export const configureAddressConfig: AssetConfigurator = withAsyncLogger(
    createConfigureNodes(
        withAsyncLogger(
            async ({ config }, sdk) => {
                if (config.addressConfig == null) return []

                const hasAddressConfig = await sdk.hasAddressConfig(config.addressConfig)

                if (hasAddressConfig) return []

                return [await sdk.setAddressConfig(config.addressConfig)]
            },
            {
                onStart: (logger, [{ config, point }]) =>
                    logger.verbose(
                        `Configuring addressConfig for ${formatOmniPoint(point)}: ${printJson(config.addressConfig)}`
                    ),
                onSuccess: (logger, [{ point }], transactions) =>
                    logger.verbose(
                        `Configured addressConfig for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                    ),
                onError: (logger, [{ point }], error) =>
                    logger.error(`Failed to configure addressConfig for ${formatOmniPoint(point)}: ${error}`),
            }
        )
    ),
    {
        onStart: (logger) => logger.info(`Configuring addressConfig`),
        onSuccess: (logger) => logger.info(`Configured addressConfig`),
    }
)

export const configureAsset: AssetConfigurator = withAsyncLogger(
    createConfigureMultiple(configureOFTPath, configureAddressConfig),
    {
        onStart: (logger) => logger.info(`Configuring`),
        onSuccess: (logger) => logger.info(`Configured`),
        onError: (logger, _, error) => logger.error(`Failed to configure: ${error}`),
    }
)

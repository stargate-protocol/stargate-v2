import {
    type Configurator,
    areBytes32Equal,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import { formatNumberOfTransactions } from '../utils/logger'

import type { BlacklistableOmniGraph, IBlacklistable } from './types'

export type BlacklistableConfigurator = Configurator<BlacklistableOmniGraph, IBlacklistable>

const createAssetLogger = () => createModuleLogger('blacklistable')
const withAsyncLogger = createWithAsyncLogger(createAssetLogger)

export const configureBlacklister: BlacklistableConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.blacklister == null) return []

            const blacklister = await sdk.getBlacklister()
            if (areBytes32Equal(blacklister, config.blacklister)) return []

            return [await sdk.setBlacklister(config.blacklister)]
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring blacklister for ${formatOmniPoint(point)}: ${config.blacklister}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Configured blackslister for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure blacklister for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

export const configureBlacklistable: BlacklistableConfigurator = createConfigureMultiple(configureBlacklister)

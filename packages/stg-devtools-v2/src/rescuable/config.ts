import {
    type Configurator,
    areBytes32Equal,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import { formatNumberOfTransactions } from '../utils/logger'

import type { IRescuable, RescuableOmniGraph } from './types'

export type RescuableConfigurator = Configurator<RescuableOmniGraph, IRescuable>

const createAssetLogger = () => createModuleLogger('rescuable')
const withAsyncLogger = createWithAsyncLogger(createAssetLogger)

export const configureRescuer: RescuableConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.rescuer == null) return []

            const rescuer = await sdk.getRescuer()
            if (areBytes32Equal(rescuer, config.rescuer)) return []

            return [await sdk.setRescuer(config.rescuer)]
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring rescuer for ${formatOmniPoint(point)}: ${config.rescuer}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Configured rescuer for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure rescuer for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

export const configureRescuable: RescuableConfigurator = createConfigureMultiple(configureRescuer)

import {
    type Configurator,
    areBytes32Equal,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import { formatNumberOfTransactions } from '../utils/logger'

import type { IPausable, PausableOmniGraph } from './types'

export type PausableConfigurator = Configurator<PausableOmniGraph, IPausable>

const createAssetLogger = () => createModuleLogger('pausable')
const withAsyncLogger = createWithAsyncLogger(createAssetLogger)

export const configurePauser: PausableConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.pauser == null) return []

            const pauser = await sdk.getPauser()
            if (areBytes32Equal(pauser, config.pauser)) return []

            return [await sdk.setPauser(config.pauser)]
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring pauser for ${formatOmniPoint(point)}: ${config.pauser}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Configured pauser for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure pauser for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

export const configurePausable: PausableConfigurator = createConfigureMultiple(configurePauser)

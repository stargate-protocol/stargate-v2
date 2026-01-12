import {
    type Configurator,
    type OmniTransaction,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import type { ITip20, Tip20OmniGraph } from './types'

export type Tip20Configurator = Configurator<Tip20OmniGraph, ITip20>

const createModuleLog = () => createModuleLogger('tip20')
const withAsyncLogger = createWithAsyncLogger(createModuleLog)

const configureAdmin: Tip20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.admin == null) return []
            const adminRole = '0x0000000000000000000000000000000000000000000000000000000000000000'
            const hasAdminRole = (await sdk.hasRole?.(config.admin, adminRole)) ?? false
            if (hasAdminRole) return []
            return [await sdk.setAdmin(config.admin)]
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring admin for ${formatOmniPoint(point)}: ${config.admin}`),
            onSuccess: (logger, [{ point }]) => logger.verbose(`Configured admin for ${formatOmniPoint(point)}`),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure admin for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

const configureIssuers: Tip20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.issuer == null) return []

            const txs: OmniTransaction[] = []
            const tx = await sdk.setIssuer(config.issuer)
            if (tx) txs.push(tx)
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring issuers for ${formatOmniPoint(point)}: ${config.issuer}`),
            onSuccess: (logger, [{ point }]) => logger.verbose(`Configured issuers for ${formatOmniPoint(point)}`),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure issuers for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

const configurePauser: Tip20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.pauser == null) return []

            const txs = []
            const pauseTx = await sdk.setPauser(config.pauser)
            if (pauseTx) txs.push(pauseTx)
            const unpauseTx = await sdk.setUnpauser(config.pauser)
            if (unpauseTx) txs.push(unpauseTx)
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring pauser for ${formatOmniPoint(point)}: ${config.pauser}`),
            onSuccess: (logger, [{ point }]) => logger.verbose(`Configured pauser for ${formatOmniPoint(point)}`),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure pauser for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

const configureBurnBlocked: Tip20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.burnBlocked == null) return []

            const txs: OmniTransaction[] = []
            const tx = await sdk.setBurnBlocked(config.burnBlocked)
            if (tx) txs.push(tx)
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring burnBlocked for ${formatOmniPoint(point)}: ${config.burnBlocked}`),
            onSuccess: (logger, [{ point }]) => logger.verbose(`Configured burnBlocked for ${formatOmniPoint(point)}`),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure burnBlocked for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

const renounceDeployerAdmin: Tip20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.admin == null) return []

            const txs: OmniTransaction[] = []
            const tx = await sdk.renounceAdmin()
            if (tx) txs.push(tx)
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring burnBlocked for ${formatOmniPoint(point)}: ${config.burnBlocked}`),
            onSuccess: (logger, [{ point }]) => logger.verbose(`Configured burnBlocked for ${formatOmniPoint(point)}`),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure burnBlocked for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

export const configureTip20: Tip20Configurator = createConfigureMultiple(
    configureIssuers,
    configurePauser,
    configureBurnBlocked
)

export const transferOwnership: Tip20Configurator = createConfigureMultiple(configureAdmin, renounceDeployerAdmin)

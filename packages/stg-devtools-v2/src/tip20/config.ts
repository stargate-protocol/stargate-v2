import {
    type Configurator,
    type OmniTransaction,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import type { ITIP20, TIP20OmniGraph } from './types'

export type TIP20Configurator = Configurator<TIP20OmniGraph, ITIP20>

const createModuleLog = () => createModuleLogger('TIP20')
const withAsyncLogger = createWithAsyncLogger(createModuleLog)

const configureAdmin: TIP20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.admin == null || config.admin == undefined) return []
            const adminRole = await sdk.getDefaultAdminRole?.()
            if (adminRole === undefined) return []
            const hasAdminRole = (await sdk.hasRole?.(config.admin, adminRole)) ?? false
            if (hasAdminRole) return []
            return [await sdk.setAdmin(config.admin)]
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring admin for ${formatOmniPoint(point)}: ${config.admin}`),
            onSuccess: (logger, [{ config, point }], transactions) => {
                if (transactions.length === 0) {
                    logger.verbose(`Admin already configured for ${formatOmniPoint(point)}: ${config.admin}`)
                    return
                }
                logger.verbose(`Configured admin for ${formatOmniPoint(point)}`)
            },
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure admin for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

const configureIssuers: TIP20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.issuer == null || config.issuer == undefined) return []

            const txs: OmniTransaction[] = []
            const tx = await sdk.setIssuer(config.issuer)
            if (tx) txs.push(tx)
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring issuers for ${formatOmniPoint(point)}: ${config.issuer}`),
            onSuccess: (logger, [{ config, point }], transactions) => {
                if (transactions.length === 0) {
                    logger.verbose(`Issuer already configured for ${formatOmniPoint(point)}: ${config.issuer}`)
                    return
                }
                logger.verbose(`Configured issuers for ${formatOmniPoint(point)}`)
            },
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure issuers for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

const configurePauser: TIP20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.pauser == null || config.pauser == undefined) return []

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
            onSuccess: (logger, [{ config, point }], transactions) => {
                if (transactions.length === 0) {
                    logger.verbose(`Pauser already configured for ${formatOmniPoint(point)}: ${config.pauser}`)
                    return
                }
                logger.verbose(`Configured pauser for ${formatOmniPoint(point)}`)
            },
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure pauser for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

const configureBurnBlocked: TIP20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.burnBlocked == null || config.burnBlocked == undefined) return []

            const txs: OmniTransaction[] = []
            const tx = await sdk.setBurnBlocked(config.burnBlocked)
            if (tx) txs.push(tx)
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring burnBlocked for ${formatOmniPoint(point)}: ${config.burnBlocked}`),
            onSuccess: (logger, [{ config, point }], transactions) => {
                if (transactions.length === 0) {
                    logger.verbose(
                        `BurnBlocked already configured for ${formatOmniPoint(point)}: ${config.burnBlocked}`
                    )
                    return
                }
                logger.verbose(`Configured burnBlocked for ${formatOmniPoint(point)}`)
            },
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure burnBlocked for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

const renounceDeployerAdmin: TIP20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.admin == null || config.admin == undefined) return []

            const txs: OmniTransaction[] = []
            const tx = await sdk.renounceAdmin()
            if (tx) txs.push(tx)
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Renouncing deployer admin for ${formatOmniPoint(point)} in favor of ${config.admin}`),
            onSuccess: (logger, [{ config, point }], transactions) => {
                if (transactions.length === 0) {
                    logger.verbose(
                        `Deployer admin already renounced for ${formatOmniPoint(point)} in favor of ${config.admin}`
                    )
                    return
                }
                logger.verbose(`Renounced deployer admin for ${formatOmniPoint(point)}`)
            },
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to renounce deployer admin for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

export const configureTIP20: TIP20Configurator = createConfigureMultiple(
    configureIssuers,
    configurePauser,
    configureBurnBlocked
)

export const transferOwnership: TIP20Configurator = createConfigureMultiple(configureAdmin, renounceDeployerAdmin)

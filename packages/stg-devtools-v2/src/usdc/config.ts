import {
    type Configurator,
    OmniTransaction,
    areBytes32Equal,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import { configureBlacklistable } from '../blacklistable'
import { configurePausable } from '../pausable'
import { configureRescuable } from '../rescuable'
import { formatNumberOfTransactions } from '../utils/logger'

import type { IUSDC, USDCOmniGraph } from './types'

export type USDCConfigurator = Configurator<USDCOmniGraph, IUSDC>

const createAssetLogger = () => createModuleLogger('USDC')
const withAsyncLogger = createWithAsyncLogger(createAssetLogger)

export const configureProxyAdmin: USDCConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.admin == null) return []

            const admin = await sdk.getAdmin()
            if (areBytes32Equal(admin, config.admin)) return []

            return [await sdk.setAdmin(config.admin)]
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring proxy admin for ${formatOmniPoint(point)}: ${config.admin}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Configured proxy admin for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure proxy admin for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

export const configureMasterMinter: USDCConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.masterMinter == null) return []

            const masterMinter = await sdk.getMasterMinter()
            if (areBytes32Equal(masterMinter, config.masterMinter)) return []

            return [await sdk.setMasterMinter(config.masterMinter)]
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring master minter for ${formatOmniPoint(point)}: ${config.masterMinter}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Configured master minter for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure master minter for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

// This configurator will only set a minter if is currently not a minter, or unset it if the configuration
// allowance is 0. In this way, it behaves like an idempotent configurator, as it will only apply the setting
// once.
export const initializeMinters: USDCConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            const txs: OmniTransaction[] = []

            for (const [minter, amount] of Object.entries(config.minters ?? {})) {
                const isMinter = await sdk.isMinter(minter)

                // If amount is set to 0, it means we want to remove the minter
                if (amount === 0n) {
                    if (isMinter) {
                        txs.push(await sdk.removeMinter(minter))
                    }
                    continue
                }

                // If it is minter, it has been configured already and we do not want to reset the allowance,
                // use resetMinters() for that
                if (isMinter) {
                    continue
                }

                txs.push(await sdk.configureMinter(minter, amount))
            }

            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Initializing minters for ${formatOmniPoint(point)}: ${config.minters}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Initialized minters for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to initialize minters for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

// This configurator will reset the allowance of any minters. Compared to initializeMinters, it is
// not idempotent, and should be used only on specific operations that intend to reset the allowance.
export const resetMinters: USDCConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            const txs: OmniTransaction[] = []

            for (const [minter, amount] of Object.entries(config.minters ?? {})) {
                const isMinter = await sdk.isMinter(minter)

                // If amount is set to 0, it means we want to remove the minter
                if (amount === 0n) {
                    if (isMinter) {
                        txs.push(await sdk.removeMinter(minter))
                    }
                    continue
                }

                const allowance = await sdk.getMinterAllowance(minter)
                if (allowance === amount) {
                    continue
                }

                txs.push(await sdk.configureMinter(minter, amount))
            }

            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Resetting minters for ${formatOmniPoint(point)}: ${config.minters}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Reset minters for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to reset minters for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

export const configureUSDC: USDCConfigurator = createConfigureMultiple(
    configureMasterMinter,
    configureBlacklistable,
    configureRescuable,
    configurePausable
)

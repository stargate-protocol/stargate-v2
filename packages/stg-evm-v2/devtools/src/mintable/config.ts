import {
    type Configurator,
    type OmniTransaction,
    createConfigureMultiple,
    createConfigureNodes,
    formatOmniPoint,
} from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import { formatNumberOfTransactions } from '../utils/logger'

import type { IMintable, MintableOmniGraph } from './types'

export type MintableConfigurator = Configurator<MintableOmniGraph, IMintable>

const createAssetLogger = () => createModuleLogger('mintable')
const withAsyncLogger = createWithAsyncLogger(createAssetLogger)

export const configureMinter: MintableConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            const txs: OmniTransaction[] = []
            for (const [minter, canMint] of Object.entries(config.minters ?? {})) {
                const isMinter = await sdk.isMinter(minter)
                if (canMint === isMinter) {
                    continue
                }

                if (canMint) {
                    txs.push(await sdk.addMinter(minter))
                } else {
                    txs.push(await sdk.removeMinter(minter))
                }
            }

            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring minters for ${formatOmniPoint(point)}: ${config.minters}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Configured minters for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure minters for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

export const configureMintable: MintableConfigurator = createConfigureMultiple(configureMinter)

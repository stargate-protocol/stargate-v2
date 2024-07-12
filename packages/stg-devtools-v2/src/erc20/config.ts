import { Configurator, createConfigureMultiple, createConfigureNodes } from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import { ERC20OmniGraph, IERC20 } from './types'

export type ERC20Configurator = Configurator<ERC20OmniGraph, IERC20>

const createAssetLogger = () => createModuleLogger('erc20')
const withAsyncLogger = createWithAsyncLogger(createAssetLogger)

export const configureAllowance: ERC20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.allowance == null) return []
            const txs = []

            for (const [owner, allowance] of Object.entries(config.allowance)) {
                for (const [spender, expectedAllowance] of Object.entries(allowance)) {
                    const actualAllowance = await sdk.getAllowance(owner, spender)
                    if (actualAllowance !== expectedAllowance) {
                        txs.push(await sdk.approve(spender, expectedAllowance))
                    }
                }
            }
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring allowance for ${point}: ${config.allowance}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(`Configured allowance for ${point}: ${transactions.length} transactions`),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure allowance for ${point}: ${error}`),
        }
    )
)

export const configureMint: ERC20Configurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.mint == null) return []
            const txs = []

            for (const [account, amount] of Object.entries(config.mint)) {
                txs.push(await sdk.mint(account, amount))
            }
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) => logger.verbose(`Configuring mint for ${point}: ${config.mint}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(`Configured mint for ${point}: ${transactions.length} transactions`),
            onError: (logger, [{ point }], error) => logger.error(`Failed to configure mint for ${point}: ${error}`),
        }
    )
)

export const configureERC20: ERC20Configurator = createConfigureMultiple(configureMint, configureAllowance)

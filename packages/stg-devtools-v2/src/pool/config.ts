import { Configurator, OmniTransaction, createConfigureNodes, formatOmniPoint } from '@layerzerolabs/devtools'
import { createModuleLogger, createWithAsyncLogger } from '@layerzerolabs/io-devtools'

import { formatNumberOfTransactions } from '../utils/logger'

import { IPool, PoolOmniGraph } from './types'

export type PoolConfigurator = Configurator<PoolOmniGraph, IPool>

const createAssetLogger = () => createModuleLogger('pool')
const withAsyncLogger = createWithAsyncLogger(createAssetLogger)

export const configureDeposit: PoolConfigurator = createConfigureNodes(
    withAsyncLogger(
        async ({ config }, sdk) => {
            if (config.depositAmount == null) return []
            const txs: OmniTransaction[] = []

            for (const [account, amount] of Object.entries(config.depositAmount)) {
                if (config?.isNative) {
                    txs.push({ ...(await sdk.deposit(account, amount)), value: amount })
                } else {
                    txs.push(await sdk.deposit(account, amount))
                }
            }
            return txs
        },
        {
            onStart: (logger, [{ config, point }]) =>
                logger.verbose(`Configuring deposit for ${formatOmniPoint(point)}: ${config.depositAmount}`),
            onSuccess: (logger, [{ point }], transactions) =>
                logger.verbose(
                    `Configured deposit for ${formatOmniPoint(point)}: ${formatNumberOfTransactions(transactions)}`
                ),
            onError: (logger, [{ point }], error) =>
                logger.error(`Failed to configure deposit for ${formatOmniPoint(point)}: ${error}`),
        }
    )
)

import { LoggerOptions, format, transports } from 'winston'

import { getAvailableChainNames, getAvailableChainsFromArgs } from './chains'
import { createProviderFromConfig, loadProviderConfigs } from './providers'

import type { BootstrapChainConfig } from './types'
import type { Provider } from '@ethersproject/providers'

export const bootstrapLoggerConfigFromArgs: LoggerOptions = {
    level: 'debug',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.prettyPrint(),
        format.colorize({ all: true })
    ),
    transports: [new transports.Console()],
}

export const getBootstrapChainConfigFromArgs = async (
    args: {
        only: string | undefined
        environment: string
        servicePath?: string
    },
    isSupportedChainName?: (chainName: string, environment: string) => boolean
): Promise<BootstrapChainConfig> => {
    const providerConfigs = await loadProviderConfigs(args.environment)
    const availableChainNames = getAvailableChainNames(providerConfigs)

    const { chainNames: filteredChainNames, initialTokensOverrides } = getAvailableChainsFromArgs(
        args,
        availableChainNames
    )

    const chainNames = isSupportedChainName
        ? filteredChainNames.filter((chainName) => {
              const [chainRawName] = chainName.split('-', 2)
              return isSupportedChainName(chainRawName, args.environment)
          })
        : filteredChainNames

    if (!chainNames.length) {
        throw new Error('No chainNames after applying filters')
    }

    const providers: { [chainName: string]: Provider } = {}
    const validChainNames: string[] = []

    for (const chainName of chainNames) {
        try {
            providers[chainName] = createProviderFromConfig(providerConfigs[chainName], chainName)
            validChainNames.push(chainName)
        } catch (error) {
            console.warn(`Skipping chain ${chainName}: ${error instanceof Error ? error.message : error}`)
        }
    }

    if (!validChainNames.length) {
        throw new Error('No chains with valid RPC URLs found after applying filters')
    }

    return {
        providers,
        environment: args.environment,
        chainNames: validChainNames,
        initialTokensOverrides,
    }
}

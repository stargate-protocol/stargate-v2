import { JsonRpcProvider } from '@ethersproject/providers'

import { getAvailableChainNamesFromDeployments } from './chains'

import type { ProviderConfig, ProviderConfigs } from './types'
import type { Provider } from '@ethersproject/providers'

export const createProviderFromConfig = (config: ProviderConfig, chainName: string): Provider => {
    if (config.uris.length === 0) {
        throw new Error(`No RPC URLs available for chain: ${chainName}`)
    }

    const uri = typeof config.uris[0] === 'string' ? config.uris[0] : config.uris[0].uri
    return new JsonRpcProvider(uri)
}

export const getRpcUrl = (chainRawName: string, environment: string): string | null => {
    if (!chainRawName || !environment) return null

    let templateUrl

    switch (environment) {
        case 'testnet':
            templateUrl = process.env.RPC_URL_TESTNET
            break
        case 'mainnet':
            templateUrl = process.env.RPC_URL_MAINNET
            break
        default:
            return null
    }

    const url = templateUrl?.replace('CHAIN', chainRawName) ?? null
    return url
}

export const loadProviderConfigs = async (environment: string, chainNames?: string[]): Promise<ProviderConfigs> => {
    try {
        const availableChainNames = chainNames || getAvailableChainNamesFromDeployments(environment)

        if (availableChainNames.length === 0) {
            throw new Error('No chain names available from deployment directories')
        }

        const providerConfigs: ProviderConfigs = {}

        for (const chainName of availableChainNames) {
            const rpcUrl = getRpcUrl(chainName, environment)
            if (rpcUrl) {
                providerConfigs[chainName] = {
                    uris: [rpcUrl],
                    quorum: 1,
                }
            } else {
                providerConfigs[chainName] = {
                    uris: [],
                    quorum: 1,
                }
                console.warn(`No RPC URL found for chain: ${chainName}`)
            }
        }

        return providerConfigs
    } catch (error) {
        throw new Error(`Failed to generate provider configs for environment ${environment}: ${error}`)
    }
}

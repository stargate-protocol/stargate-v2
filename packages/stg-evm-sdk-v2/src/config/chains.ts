import * as fsSync from 'fs'
import * as path from 'path'

import type { ProviderConfigs } from './types'

export const getAvailableChainNamesFromDeployments = (environment: string, sorted = false): string[] => {
    try {
        const deploymentsPath = path.join(__dirname, '..', '..', 'deployments')

        if (!fsSync.existsSync(deploymentsPath)) {
            console.warn(`Deployments directory not found: ${deploymentsPath}`)
            return []
        }

        const deploymentDirs = fsSync
            .readdirSync(deploymentsPath, { withFileTypes: true })
            .filter((dirent: fsSync.Dirent) => dirent.isDirectory())
            .map((dirent: fsSync.Dirent) => dirent.name)

        let filteredDirs: string[]

        if (environment === 'mainnet') {
            filteredDirs = deploymentDirs.filter((dir: string) => dir.endsWith('-mainnet'))
        } else if (environment === 'testnet') {
            filteredDirs = deploymentDirs.filter((dir: string) => dir.endsWith('-testnet'))
        } else {
            console.warn(`Unsupported environment: ${environment}. Returning all deployment directories.`)
            filteredDirs = deploymentDirs
        }

        // Extract raw chain names by removing the environment suffix
        const chainNames = filteredDirs
            .map((dir: string) => {
                if (dir.endsWith('-mainnet')) {
                    return dir.replace(/-mainnet$/, '')
                } else if (dir.endsWith('-testnet')) {
                    return dir.replace(/-testnet$/, '')
                } else {
                    return dir
                }
            })
            .filter((name: string) => name.length > 0)

        // Return unique chain names, sorted if requested
        const uniqueChainNames = Array.from(new Set(chainNames))
        return sorted ? uniqueChainNames.sort() : uniqueChainNames
    } catch (error) {
        console.warn(`Failed to read deployment directories for environment ${environment}: ${error}`)
        return []
    }
}

export const getAvailableChainNames = (providerConfigs: ProviderConfigs): string[] => {
    return Object.keys(providerConfigs)
}

export const getAvailableChainsFromArgs = (
    args: {
        only: string | undefined
        environment: string
    },
    availableChainNames: string[]
): {
    chainNames: string[]
    initialTokensOverrides: {
        [chainName: string]: string | { [key: string]: string }
    }
} => {
    if (args.only) {
        const chainNames: string[] = []
        const initialTokensOverrides = args.only.split(',').reduce(
            (
                acc: {
                    [chainName: string]: string | { [key: string]: string }
                },
                o: string
            ) => {
                const override = o.split(':')[1]
                const chainName = availableChainNames.find((cn: string) => cn.startsWith(o.split(':')[0]))
                if (chainName) {
                    chainNames.push(chainName)
                    if (o.split(':')[1]) {
                        const currentToken = override && o.split(':')[1]
                        acc[chainName] = currentToken
                    }
                }

                return acc
            },
            {}
        )

        return { chainNames, initialTokensOverrides }
    }

    return { chainNames: availableChainNames, initialTokensOverrides: {} }
}

export const getAvailableChainNamesByEnvironment = (environment: string): string[] => {
    return getAvailableChainNamesFromDeployments(environment, true)
}

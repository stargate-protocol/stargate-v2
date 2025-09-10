import { getAllChainsConfig, setStage } from '@stargatefinance/stg-evm-v2/devtools/config/utils/utils.config'

import { Stage } from '@layerzerolabs/lz-definitions'

enum ChainStatus {
    DEPRECATED = 'DEPRECATED', // not supported by stargate
    INACTIVE = 'INACTIVE', // supported by stargate butwill not be included in the checker
    ACTIVE = 'ACTIVE', // supported by stargate and will be included in the checker
}

/**
 * @returns Object mapping chain names to their status
 */
function loadMainnetChainsFromYaml(): { [chainName: string]: ChainStatus } {
    const mainnetChains: { [chainName: string]: ChainStatus } = {}

    try {
        setStage(Stage.MAINNET)
        const allChains = getAllChainsConfig()
        for (const chainConfig of allChains) {
            if (!chainConfig.name) {
                console.warn(`Skipping chain config: missing name field`)
                continue
            }

            // Extract chain name by removing the -mainnet suffix
            let chainName = chainConfig.name
            if (chainName.endsWith('-mainnet')) {
                chainName = chainName.replace(/-mainnet$/, '')
            }

            // Determine status: use explicit status field if present, otherwise default to ACTIVE
            let status = ChainStatus.ACTIVE
            if (chainConfig.status) {
                if (chainConfig.status.toUpperCase() === 'DEPRECATED') {
                    status = ChainStatus.DEPRECATED
                } else if (chainConfig.status.toUpperCase() === 'INACTIVE') {
                    status = ChainStatus.INACTIVE
                }
            }

            mainnetChains[chainName] = status
        }
    } catch (error) {
        console.warn('Failed to load mainnet chains from config:', error)
    }

    return mainnetChains
}

/**
 * @returns Object mapping chain names to their status
 */
function loadTestnetChainsFromYaml(): { [chainName: string]: ChainStatus } {
    const testnetChains: { [chainName: string]: ChainStatus } = {}

    try {
        setStage(Stage.TESTNET)
        const allChains = getAllChainsConfig()

        for (const chainConfig of allChains) {
            if (!chainConfig.name) {
                console.warn(`Skipping chain config: missing name field`)
                continue
            }

            // Extract chain name by removing the -testnet suffix
            let chainName = chainConfig.name
            if (chainName.endsWith('-testnet')) {
                chainName = chainName.replace(/-testnet$/, '')
            }

            // Determine status: use explicit status field if present, otherwise default to ACTIVE
            let status = ChainStatus.ACTIVE
            if (chainConfig.status) {
                if (chainConfig.status.toUpperCase() === 'DEPRECATED') {
                    status = ChainStatus.DEPRECATED
                } else if (chainConfig.status.toUpperCase() === 'INACTIVE') {
                    status = ChainStatus.INACTIVE
                }
            }

            testnetChains[chainName] = status
        }
    } catch (error) {
        console.warn('Failed to load testnet chains from config:', error)
    }

    return testnetChains
}

const stargateV2ChainNamesPerEnvironment: {
    [environment: string]: { [chainName: string]: ChainStatus }
} = {
    testnet: loadTestnetChainsFromYaml(),
    mainnet: loadMainnetChainsFromYaml(),
}

const stargateV2SupportedChainNamesPerEnvironment: {
    [environment: string]: string[]
} = Object.fromEntries(
    Object.entries(stargateV2ChainNamesPerEnvironment).map(([environment, chains]) => [
        environment,
        Object.entries(chains)
            .filter(([_, status]) => status !== ChainStatus.DEPRECATED && status !== ChainStatus.INACTIVE)
            .map(([chainName, _]) => chainName),
    ])
)

export const isStargateV2SupportedChainName = (chainName: string, environment: string): boolean => {
    return stargateV2SupportedChainNamesPerEnvironment[environment].includes(chainName)
}

export const filterStargateV2SupportedChainNames = (chainNames: string[], environment: string): string[] => {
    return chainNames.filter((chainName) => isStargateV2SupportedChainName(chainName, environment))
}

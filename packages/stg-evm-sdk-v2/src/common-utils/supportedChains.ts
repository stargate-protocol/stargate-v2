import { getAllChainsConfig } from '@stargatefinance/stg-evm-v2/devtools/config/mainnet/utils'
import { type Chain } from '@stargatefinance/stg-evm-v2/devtools/config/utils'

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
            const configWithStatus = chainConfig as Chain & { status?: string }
            if (configWithStatus.status) {
                if (configWithStatus.status.toUpperCase() === 'DEPRECATED') {
                    status = ChainStatus.DEPRECATED
                } else if (configWithStatus.status.toUpperCase() === 'INACTIVE') {
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

const stargateV2ChainNamesPerEnvironment: {
    [environment: string]: { [chainName: string]: ChainStatus }
} = {
    testnet: {
        bsc: ChainStatus.ACTIVE,
        sepolia: ChainStatus.ACTIVE,
        arbsep: ChainStatus.ACTIVE,
        optsep: ChainStatus.ACTIVE,
        klaytn: ChainStatus.ACTIVE,
        bl3: ChainStatus.DEPRECATED,
        mantlesep: ChainStatus.ACTIVE,
        odyssey: ChainStatus.DEPRECATED,
    },
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
    console.log(chainNames.filter((chainName) => isStargateV2SupportedChainName(chainName, environment)))
    return chainNames.filter((chainName) => isStargateV2SupportedChainName(chainName, environment))
}

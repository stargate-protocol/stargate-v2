import { ChainStatus } from './utils'

//setting a chain to INACTIVE causes balancing to not run on that chain
//setting a chain to DEPRECATED causes all stargate services to not run on that chain
export const stargateV2ChainNamesPerEnvironment: {
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
    mainnet: {
        arbitrum: ChainStatus.ACTIVE,
        aurora: ChainStatus.ACTIVE,
        avalanche: ChainStatus.ACTIVE,
        base: ChainStatus.ACTIVE,
        bsc: ChainStatus.ACTIVE,
        ebi: ChainStatus.DEPRECATED,
        ethereum: ChainStatus.ACTIVE,
        kava: ChainStatus.ACTIVE,
        klaytn: ChainStatus.ACTIVE,
        mantle: ChainStatus.ACTIVE,
        metis: ChainStatus.ACTIVE,
        optimism: ChainStatus.ACTIVE,
        polygon: ChainStatus.ACTIVE,
        scroll: ChainStatus.ACTIVE,
        zkconsensys: ChainStatus.ACTIVE,
        rarible: ChainStatus.ACTIVE,
        iota: ChainStatus.ACTIVE,
        taiko: ChainStatus.ACTIVE,
        sei: ChainStatus.ACTIVE,
        xchain: ChainStatus.ACTIVE,
        flare: ChainStatus.ACTIVE,
        gravity: ChainStatus.ACTIVE,
        coredao: ChainStatus.ACTIVE,
        lightlink: ChainStatus.ACTIVE,
        peaq: ChainStatus.ACTIVE,
        degen: ChainStatus.ACTIVE,
        plume: ChainStatus.ACTIVE,
        superposition: ChainStatus.ACTIVE,
        codex: ChainStatus.ACTIVE,
        islander: ChainStatus.ACTIVE,
        ink: ChainStatus.ACTIVE,
        fuse: ChainStatus.ACTIVE,
        hemi: ChainStatus.ACTIVE,
        rootstock: ChainStatus.ACTIVE,
        abstract: ChainStatus.ACTIVE,
        bera: ChainStatus.ACTIVE,
        glue: ChainStatus.ACTIVE,
        flow: ChainStatus.ACTIVE,
        soneium: ChainStatus.ACTIVE,
        story: ChainStatus.ACTIVE,
        goat: ChainStatus.ACTIVE,
        unichain: ChainStatus.ACTIVE,
        gnosis: ChainStatus.ACTIVE,
        sonic: ChainStatus.ACTIVE,
        telos: ChainStatus.ACTIVE,
        ape: ChainStatus.ACTIVE,
        cronosevm: ChainStatus.ACTIVE,
        cronoszkevm: ChainStatus.ACTIVE,
        plumephoenix: ChainStatus.ACTIVE,
        nibiru: ChainStatus.ACTIVE,
        xdc: ChainStatus.ACTIVE,
        manta: ChainStatus.ACTIVE,
        botanix: ChainStatus.ACTIVE,
    },
}

export const stargateV2SupportedChainNamesPerEnvironment: {
    [environment: string]: string[]
} = Object.fromEntries(
    Object.entries(stargateV2ChainNamesPerEnvironment).map(([environment, chains]) => [
        environment,
        Object.entries(chains)
            .filter(([_, status]) => status !== ChainStatus.DEPRECATED)
            .map(([chainName, _]) => chainName),
    ])
)

export const isStargateV2SupportedChainName = (chainName: string, environment: string): boolean => {
    return stargateV2SupportedChainNamesPerEnvironment[environment].includes(chainName)
}

export const filterStargateV2SupportedChainNames = (chainNames: string[], environment: string): string[] => {
    return chainNames.filter((chainName) => isStargateV2SupportedChainName(chainName, environment))
}

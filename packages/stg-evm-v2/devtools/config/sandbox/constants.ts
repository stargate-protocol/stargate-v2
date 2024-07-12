import { FeeConfig } from '@stargatefinance/stg-devtools-v2'

export const DEFAULT_PLANNER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

// used by offchain to run tests, its test... test junk
export const OFFCHAIN_MINTER = '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'

export const DEFAULT_FEE_CONFIG = {
    zone1UpperBound: 0n,
    zone2UpperBound: 0n,
    zone1FeeMillionth: 5n,
    zone2FeeMillionth: 5n,
    zone3FeeMillionth: 5n,
    rewardMillionth: 0n,
} satisfies FeeConfig

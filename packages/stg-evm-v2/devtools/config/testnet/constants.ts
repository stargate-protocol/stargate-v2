import { FeeConfig } from '@stargatefinance/stg-devtools-v2'

export const DEFAULT_PLANNER = '0x3E709fE32234514F1bFd851c9d7118AC253A2b55'

export const DEFAULT_FEE_CONFIG = {
    zone1UpperBound: 0n,
    zone2UpperBound: 0n,
    zone1FeeMillionth: 5n,
    zone2FeeMillionth: 5n,
    zone3FeeMillionth: 5n,
    rewardMillionth: 0n,
} satisfies FeeConfig

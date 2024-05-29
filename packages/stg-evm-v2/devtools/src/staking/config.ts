import { Configurator, areBytes32Equal, createConfigureMultiple, createConfigureNodes } from '@layerzerolabs/devtools'

import type { IStaking, StakingOmniGraph } from './types'

export type StakingConfigurator = Configurator<StakingOmniGraph, IStaking>

export const configurePools: StakingConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    const txs = []
    for (const pool of config.pools) {
        const rewarder = await sdk.getPool(pool.token)
        if (areBytes32Equal(rewarder, pool.rewarder)) continue

        txs.push(await sdk.setPool(pool.token, pool.rewarder))
    }

    return txs
})

export const configureStaking: StakingConfigurator = createConfigureMultiple(configurePools)

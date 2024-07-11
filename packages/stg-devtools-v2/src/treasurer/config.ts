import { Configurator, areBytes32Equal, createConfigureMultiple, createConfigureNodes } from '@layerzerolabs/devtools'

import type { ITreasurer, TreasurerOmniGraph } from './types'

export type TreasurerConfigurator = Configurator<TreasurerOmniGraph, ITreasurer>

export const configureTreasurerAdmin: TreasurerConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    const admin = await sdk.getAdmin()
    if (areBytes32Equal(admin, config.admin)) return []

    return await sdk.setAdmin(config.admin)
})

export const configureTreasurerAsset: TreasurerConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    const txs = []
    for (const [asset, managed] of Object.entries(config.assets)) {
        const currentManaged = await sdk.getAsset(asset)
        if (currentManaged === managed) continue

        txs.push(await sdk.setAsset(asset, managed))
    }
    return txs
})

export const configureTreasurer: TreasurerConfigurator = createConfigureMultiple(
    configureTreasurerAdmin,
    configureTreasurerAsset
)

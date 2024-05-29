import { type Configurator, type OmniTransaction, createConfigureNodes } from '@layerzerolabs/devtools'

import { IMessaging, MessagingOmniGraph } from './types'

export type MessagingConfigurator = Configurator<MessagingOmniGraph, IMessaging>

export const configureMaxAssetId: MessagingConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    if (config.maxAssetId == null) return

    const maxAssetId = await sdk.getMaxAssetId()
    if (maxAssetId === config.maxAssetId) return []

    return [await sdk.setMaxAssetId(config.maxAssetId)]
})

export const configureAssets: MessagingConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    if (config.assets == null) return

    const txs: OmniTransaction[] = []
    await Promise.all(
        Object.entries(config.assets).map(async ([address, assetId]) => {
            const currentAssetId = await sdk.getAssetId(address)

            if (currentAssetId === assetId) return

            txs.push(await sdk.setAssetId(address, assetId))
        })
    )

    return txs
})

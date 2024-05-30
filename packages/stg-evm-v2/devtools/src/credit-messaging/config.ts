import {
    type Configurator,
    areBytes32Equal,
    createConfigureEdges,
    createConfigureMultiple,
    createConfigureNodes,
} from '@layerzerolabs/devtools'
import { configureOApp } from '@layerzerolabs/ua-devtools'

import { configureAssets, configureMaxAssetId } from '../messaging/config'

import type { CreditMessagingOmniGraph, ICreditMessaging } from './types'

export type CreditMessagingConfigurator = Configurator<CreditMessagingOmniGraph, ICreditMessaging>

export const configurePlanner: CreditMessagingConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    const planner = await sdk.getPlanner()
    if (areBytes32Equal(planner, config.planner)) return []

    if (!config.planner) {
        return [] // No planner to set, do not overwrite the existing one
    }

    return [await sdk.setPlanner(config.planner)]
})

export const configureGasLimit: CreditMessagingConfigurator = createConfigureEdges(
    async ({ vector: { to }, config }, sdk) => {
        const gasLimit = await sdk.getGasLimit(to.eid)

        if (gasLimit == config.gasLimit) return []

        return [await sdk.setGasLimit(to.eid, config.gasLimit)]
    }
)

export const configureCreditMessaging: CreditMessagingConfigurator = createConfigureMultiple(
    configurePlanner,
    configureGasLimit,
    configureMaxAssetId,
    configureAssets,
    configureOApp
)

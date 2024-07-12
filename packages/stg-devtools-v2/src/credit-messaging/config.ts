import { type Configurator, createConfigureEdges, createConfigureMultiple } from '@layerzerolabs/devtools'

import { configureMessaging } from '../messaging/config'

import type { CreditMessagingOmniGraph, ICreditMessaging } from './types'

export type CreditMessagingConfigurator = Configurator<CreditMessagingOmniGraph, ICreditMessaging>

export const configureCreditMessagingGasLimit: CreditMessagingConfigurator = createConfigureEdges(
    async ({ vector: { to }, config }, sdk) => {
        const gasLimit = await sdk.getGasLimit(to.eid)

        if (gasLimit == config.gasLimit) return []

        return [await sdk.setGasLimit(to.eid, config.gasLimit)]
    }
)

export const configureCreditMessaging: CreditMessagingConfigurator = createConfigureMultiple(
    configureMessaging,
    configureCreditMessagingGasLimit
)

import { Configurator, createConfigureMultiple, createConfigureNodes } from '@layerzerolabs/devtools'

import { IOFTWrapper, OFTWrapperOmniGraph } from './types'

export type OFTWrapperConfigurator = Configurator<OFTWrapperOmniGraph, IOFTWrapper>

export const configureDefaultBps: OFTWrapperConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    if (config.defaultBps == null) return []

    const defaultBps = await sdk.getDefaultBps()
    if (defaultBps === config.defaultBps) return []

    return await sdk.setDefaultBps(config.defaultBps)
})

export const configureOftBps: OFTWrapperConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    if (config.oftBps == null) return []

    const transactons = await Promise.all(
        Object.entries(config.oftBps).map(async ([token, configBps]) => {
            if (configBps == null) return []

            const bps = await sdk.getOFTBps(token)
            if (bps === configBps) return []

            return [await sdk.setOFTBps(token, configBps)]
        })
    )

    return transactons.flat()
})

export const configureOFTWrapper: OFTWrapperConfigurator = createConfigureMultiple(configureDefaultBps, configureOftBps)

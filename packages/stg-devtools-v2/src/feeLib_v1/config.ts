import { Configurator, createConfigureEdges, createConfigureMultiple, isDeepEqual } from '@layerzerolabs/devtools'

import type { FeeLibV1OmniGraph, IFeeLibV1 } from './types'

export type FeeLibV1Configurator = Configurator<FeeLibV1OmniGraph, IFeeLibV1>

export const configureFeeLibV1FeeConfig: FeeLibV1Configurator = createConfigureEdges(
    async ({ vector: { to }, config }, sdk) => {
        const feeConfig = await sdk.getFeeConfig(to.eid)

        if (isDeepEqual(feeConfig, config.feeConfig)) return []

        return [
            await sdk.setFeeConfig(
                to.eid,
                config.feeConfig.zone1UpperBound,
                config.feeConfig.zone2UpperBound,
                config.feeConfig.zone1FeeMillionth,
                config.feeConfig.zone2FeeMillionth,
                config.feeConfig.zone3FeeMillionth,
                config.feeConfig.rewardMillionth
            ),
        ]
    }
)

export const configureFeeLibV1Paused: FeeLibV1Configurator = createConfigureEdges(
    async ({ vector: { to }, config }, sdk) => {
        const paused = await sdk.getPaused(to.eid)

        if (paused === config.paused) return []

        return [await sdk.setPaused(to.eid, config.paused)]
    }
)

export const configureFeeLibV1: FeeLibV1Configurator = createConfigureMultiple(
    configureFeeLibV1FeeConfig,
    configureFeeLibV1Paused
)

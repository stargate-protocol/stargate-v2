import { RewarderNodeConfigSchema, RewarderRewardsNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'
import { z } from 'zod'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const RewarderOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(RewarderNodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

export const RewarderRewardsOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(RewarderRewardsNodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

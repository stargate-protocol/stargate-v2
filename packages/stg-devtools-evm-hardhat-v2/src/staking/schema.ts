import { StakingNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'
import { z } from 'zod'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const StakingOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(StakingNodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

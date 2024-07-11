import { PoolNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'
import { z } from 'zod'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const PoolOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(PoolNodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

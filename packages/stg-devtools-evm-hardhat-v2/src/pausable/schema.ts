import { PausableEdgeConfigSchema, PausableNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const PausableOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(PausableNodeConfigSchema),
    createOmniEdgeHardhatSchema(PausableEdgeConfigSchema)
)

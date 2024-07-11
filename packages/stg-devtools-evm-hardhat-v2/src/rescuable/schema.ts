import { RescuableEdgeConfigSchema, RescuableNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const RescuableOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(RescuableNodeConfigSchema),
    createOmniEdgeHardhatSchema(RescuableEdgeConfigSchema)
)

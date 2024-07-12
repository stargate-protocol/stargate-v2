import { BlacklistableEdgeConfigSchema, BlacklistableNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const BlacklistableOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(BlacklistableNodeConfigSchema),
    createOmniEdgeHardhatSchema(BlacklistableEdgeConfigSchema)
)

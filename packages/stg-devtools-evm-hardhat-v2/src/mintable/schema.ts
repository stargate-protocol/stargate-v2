import { MintableEdgeConfigSchema, MintableNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const MintableOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(MintableNodeConfigSchema),
    createOmniEdgeHardhatSchema(MintableEdgeConfigSchema)
)

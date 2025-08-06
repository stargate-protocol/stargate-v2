import { CircleFiatTokenEdgeConfigSchema, CircleFiatTokenNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const CircleFiatTokenOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(CircleFiatTokenNodeConfigSchema),
    createOmniEdgeHardhatSchema(CircleFiatTokenEdgeConfigSchema)
)

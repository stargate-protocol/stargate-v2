import { Tip20EdgeConfigSchema, Tip20NodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const Tip20OmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(Tip20NodeConfigSchema),
    createOmniEdgeHardhatSchema(Tip20EdgeConfigSchema)
)

import { TIP20EdgeConfigSchema, TIP20NodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const TIP20OmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(TIP20NodeConfigSchema),
    createOmniEdgeHardhatSchema(TIP20EdgeConfigSchema)
)

import { USDCEdgeConfigSchema, USDCNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const USDCOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(USDCNodeConfigSchema),
    createOmniEdgeHardhatSchema(USDCEdgeConfigSchema)
)

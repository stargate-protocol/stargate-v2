import { CreditMessagingEdgeConfigSchema, CreditMessagingNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const CreditMessagingOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(CreditMessagingNodeConfigSchema),
    createOmniEdgeHardhatSchema(CreditMessagingEdgeConfigSchema)
)

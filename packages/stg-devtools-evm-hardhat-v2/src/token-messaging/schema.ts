import { TokenMessagingEdgeConfigSchema, TokenMessagingNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const TokenMessagingOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(TokenMessagingNodeConfigSchema),
    createOmniEdgeHardhatSchema(TokenMessagingEdgeConfigSchema)
)

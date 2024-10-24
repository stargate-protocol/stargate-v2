import {
    type TokenMessagingEdgeConfig,
    TokenMessagingEdgeConfigSchema,
    type TokenMessagingNodeConfig,
    TokenMessagingNodeConfigSchema,
} from '@stargatefinance/stg-devtools-v2'

import {
    type OmniGraphHardhat,
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const TokenMessagingOmniGraphHardhatSchema: Zod.ZodSchema<
    OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>,
    Zod.ZodTypeDef,
    unknown
> = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(TokenMessagingNodeConfigSchema),
    createOmniEdgeHardhatSchema(TokenMessagingEdgeConfigSchema)
)

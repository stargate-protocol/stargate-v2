import {
    type CreditMessagingEdgeConfig,
    CreditMessagingEdgeConfigSchema,
    type CreditMessagingNodeConfig,
    CreditMessagingNodeConfigSchema,
} from '@stargatefinance/stg-devtools-v2'

import {
    type OmniGraphHardhat,
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const CreditMessagingOmniGraphHardhatSchema: Zod.ZodSchema<
    OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>,
    Zod.ZodTypeDef,
    unknown
> = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(CreditMessagingNodeConfigSchema),
    createOmniEdgeHardhatSchema(CreditMessagingEdgeConfigSchema)
)

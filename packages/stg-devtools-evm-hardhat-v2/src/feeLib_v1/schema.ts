import { FeeConfig, FeeLibV1EdgeConfigSchema, FeeLibV1NodeConfigSchema } from '@stargatefinance/stg-devtools-v2'
import { z } from 'zod'

import { UIntBigIntSchema } from '@layerzerolabs/devtools'
import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

/**
 * Schema for parsing an ethers-specific FeeConfig into a common format
 */
export const FeeConfigSchema = z.object({
    zone1UpperBound: UIntBigIntSchema,
    zone2UpperBound: UIntBigIntSchema,
    zone1FeeMillionth: UIntBigIntSchema,
    zone2FeeMillionth: UIntBigIntSchema,
    zone3FeeMillionth: UIntBigIntSchema,
    rewardMillionth: UIntBigIntSchema,
}) satisfies z.ZodSchema<FeeConfig, z.ZodTypeDef, unknown>

export const FeeLibV1OmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(FeeLibV1NodeConfigSchema),
    createOmniEdgeHardhatSchema(FeeLibV1EdgeConfigSchema)
)

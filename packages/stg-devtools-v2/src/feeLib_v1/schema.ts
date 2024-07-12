import { z } from 'zod'

import { UIntBigIntSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import { FeeConfig, FeeLibV1EdgeConfig } from './types'

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

/**
 * Schema for parsing an ethers-specific BusFareConfig into a common format
 */

export const FeeLibV1NodeConfigSchema = OwnableNodeConfigSchema

export const FeeLibV1EdgeConfigSchema = z.object({
    paused: z.boolean(),
    feeConfig: FeeConfigSchema,
}) satisfies z.ZodSchema<FeeLibV1EdgeConfig, z.ZodTypeDef, unknown>

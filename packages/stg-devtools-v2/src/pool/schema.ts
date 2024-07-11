import { z } from 'zod'

import { AddressSchema, UIntBigIntSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import { PoolConfig, PoolNodeConfig } from './types'

export const PoolConfigSchema = z.record(AddressSchema, UIntBigIntSchema) satisfies z.ZodSchema<
    PoolConfig,
    z.ZodTypeDef,
    unknown
>

export const PoolNodeConfigSchema = OwnableNodeConfigSchema.extend({
    depositAmount: PoolConfigSchema,
    isNative: z.boolean().optional(),
}) satisfies z.ZodSchema<PoolNodeConfig, z.ZodTypeDef, unknown>

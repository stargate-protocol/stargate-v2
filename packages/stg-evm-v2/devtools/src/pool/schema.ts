import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'
import { BigNumberishBigIntSchema } from '@layerzerolabs/devtools-evm'
import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import { PoolConfig, PoolNodeConfig } from './types'

export const PoolConfigSchema = z.record(AddressSchema, BigNumberishBigIntSchema) satisfies z.ZodSchema<
    PoolConfig,
    z.ZodTypeDef,
    unknown
>

export const PoolNodeConfigSchema = OwnableNodeConfigSchema.extend({
    depositAmount: PoolConfigSchema,
    isNative: z.boolean().optional(),
}) satisfies z.ZodSchema<PoolNodeConfig, z.ZodTypeDef, unknown>

export const PoolOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(PoolNodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'
import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

import type { MintableNodeConfig } from './types'

export const MintableNodeConfigSchema = z.object({
    minters: z.record(AddressSchema, z.boolean()).optional(),
}) satisfies z.ZodSchema<MintableNodeConfig, z.ZodTypeDef, unknown>

export const MintableEdgeConfigSchema = z.unknown()

export const MintableOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(MintableNodeConfigSchema),
    createOmniEdgeHardhatSchema(MintableEdgeConfigSchema)
)

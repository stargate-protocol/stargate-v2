import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'
import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

import type { PausableNodeConfig } from './types'

export const PausableNodeConfigSchema = z.object({
    pauser: AddressSchema.optional(),
}) satisfies z.ZodSchema<PausableNodeConfig, z.ZodTypeDef, unknown>

export const PausableEdgeConfigSchema = z.unknown()

export const PausableOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(PausableNodeConfigSchema),
    createOmniEdgeHardhatSchema(PausableEdgeConfigSchema)
)

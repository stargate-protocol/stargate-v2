import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'

import type { MintableNodeConfig } from './types'

export const MintableNodeConfigSchema = z.object({
    minters: z.record(AddressSchema, z.boolean()).optional(),
}) satisfies z.ZodSchema<MintableNodeConfig, z.ZodTypeDef, unknown>

export const MintableEdgeConfigSchema = z.unknown()

import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'

import type { BlacklistableNodeConfig } from './types'

export const BlacklistableNodeConfigSchema = z.object({
    blacklister: AddressSchema.optional(),
}) satisfies z.ZodSchema<BlacklistableNodeConfig, z.ZodTypeDef, unknown>

export const BlacklistableEdgeConfigSchema = z.unknown()

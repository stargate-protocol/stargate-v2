import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'

import type { PausableNodeConfig } from './types'

export const PausableNodeConfigSchema = z.object({
    pauser: AddressSchema.optional(),
}) satisfies z.ZodSchema<PausableNodeConfig, z.ZodTypeDef, unknown>

export const PausableEdgeConfigSchema = z.unknown()

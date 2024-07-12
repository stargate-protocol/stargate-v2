import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'

import type { RescuableNodeConfig } from './types'

export const RescuableNodeConfigSchema = z.object({
    rescuer: AddressSchema.optional(),
}) satisfies z.ZodSchema<RescuableNodeConfig, z.ZodTypeDef, unknown>

export const RescuableEdgeConfigSchema = z.unknown()

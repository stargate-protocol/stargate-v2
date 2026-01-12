import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'

import type { Tip20NodeConfig } from './types'

export const Tip20NodeConfigSchema = z.object({
    admin: AddressSchema.optional(),
    issuer: AddressSchema.optional(),
    pauser: AddressSchema.optional(),
    burnBlocked: AddressSchema.optional(),
}) satisfies z.ZodSchema<Tip20NodeConfig, z.ZodTypeDef, unknown>

export const Tip20EdgeConfigSchema = z.unknown()

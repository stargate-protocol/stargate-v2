import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'

import type { TIP20NodeConfig } from './types'

export const TIP20NodeConfigSchema = z.object({
    admin: AddressSchema.optional(),
    issuer: AddressSchema.optional(),
    pauser: AddressSchema.optional(),
    burnBlocked: AddressSchema.optional(),
}) satisfies z.ZodSchema<TIP20NodeConfig, z.ZodTypeDef, unknown>

export const TIP20EdgeConfigSchema = z.unknown()

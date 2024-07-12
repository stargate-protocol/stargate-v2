import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import type { TreasurerNodeConfig } from './types'

export const TreasurerNodeConfigSchema = OwnableNodeConfigSchema.extend({
    admin: AddressSchema,
    assets: z.record(AddressSchema, z.boolean()),
}) satisfies z.ZodSchema<TreasurerNodeConfig, z.ZodTypeDef, unknown>

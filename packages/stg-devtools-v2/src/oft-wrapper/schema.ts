import { z } from 'zod'

import { AddressSchema, UIntBigIntSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import type { OFTWrapperNodeConfig } from './types'

export const OFTBpsSchema = z.record(AddressSchema, UIntBigIntSchema.optional())

export const OFTWrapperNodeConfigSchema = OwnableNodeConfigSchema.extend({
    defaultBps: UIntBigIntSchema.optional(),
    oftBps: OFTBpsSchema,
}) satisfies z.ZodSchema<OFTWrapperNodeConfig, z.ZodTypeDef, unknown>

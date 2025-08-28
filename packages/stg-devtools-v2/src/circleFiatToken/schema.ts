import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import { BlacklistableNodeConfigSchema } from '../blacklistable'
import { PausableNodeConfigSchema } from '../pausable'
import { RescuableNodeConfigSchema } from '../rescuable'

import type { CircleFiatTokenNodeConfig } from './types'

export const CircleFiatTokenNodeConfigSchema = z
    .object({
        masterMinter: AddressSchema.optional(),
        admin: AddressSchema.optional(),
        minters: z.record(AddressSchema, z.bigint()).optional(),
    })
    .merge(RescuableNodeConfigSchema)
    .merge(PausableNodeConfigSchema)
    .merge(BlacklistableNodeConfigSchema)
    .merge(OwnableNodeConfigSchema) satisfies z.ZodSchema<CircleFiatTokenNodeConfig, z.ZodTypeDef, unknown>

export const CircleFiatTokenEdgeConfigSchema = z.unknown()

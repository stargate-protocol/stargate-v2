import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'
import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import type { TreasurerNodeConfig } from './types'

export const TreasurerNodeConfigSchema = OwnableNodeConfigSchema.extend({
    admin: AddressSchema,
    assets: z.record(AddressSchema, z.boolean()),
}) satisfies z.ZodSchema<TreasurerNodeConfig, z.ZodTypeDef, unknown>

export const TreasurerOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(TreasurerNodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

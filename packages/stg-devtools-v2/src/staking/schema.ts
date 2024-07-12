import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import type { StakingNodeConfig, StakingPoolConfig } from './types'

export const StakingPoolConfigSchema = z.object({
    rewarder: AddressSchema,
    token: AddressSchema,
}) satisfies z.ZodSchema<StakingPoolConfig, z.ZodTypeDef, unknown>

export const StakingNodeConfigSchema = OwnableNodeConfigSchema.extend({
    pools: z.array(StakingPoolConfigSchema),
}) satisfies z.ZodSchema<StakingNodeConfig, z.ZodTypeDef, unknown>

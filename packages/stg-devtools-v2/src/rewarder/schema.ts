import { z } from 'zod'

import { AddressSchema, UIntBigIntSchema, UIntNumberSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import type {
    Allocations,
    RewardConfig,
    RewarderAllocationsConfig,
    RewarderNodeConfig,
    RewarderRewardsNodeConfig,
} from './types'

export const AllocationsSchema = z.record(AddressSchema, UIntNumberSchema) satisfies z.ZodSchema<
    Allocations,
    z.ZodTypeDef,
    unknown
>

export const RewarderAllocationsConfigSchema = z.record(AddressSchema, AllocationsSchema) satisfies z.ZodSchema<
    RewarderAllocationsConfig,
    z.ZodTypeDef,
    unknown
>

export const RewardConfigSchema = z.object({
    rewardToken: AddressSchema,
    amount: UIntBigIntSchema,
    start: UIntNumberSchema,
    duration: UIntNumberSchema,
}) satisfies z.ZodSchema<RewardConfig, z.ZodTypeDef, unknown>

export const RewarderNodeConfigSchema = OwnableNodeConfigSchema.extend({
    allocations: RewarderAllocationsConfigSchema,
}) satisfies z.ZodSchema<RewarderNodeConfig, z.ZodTypeDef, unknown>

export const RewarderRewardsNodeConfigSchema = OwnableNodeConfigSchema.extend({
    rewards: RewardConfigSchema,
}) satisfies z.ZodSchema<RewarderRewardsNodeConfig, z.ZodTypeDef, unknown>

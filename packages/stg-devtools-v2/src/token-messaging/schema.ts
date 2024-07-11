import { z } from 'zod'

import { AddressSchema, UIntBigIntSchema, UIntNumberSchema } from '@layerzerolabs/devtools'

import { MessagingEdgeConfigSchema, MessagingNodeConfigSchema } from '../messaging'

import type { Fares, TokenMessagingEdgeConfig, TokenMessagingGasLimits, TokenMessagingNodeConfig } from './types'

export const FaresSchema = z.object({
    busFare: UIntBigIntSchema,
    busAndNativeDropFare: UIntBigIntSchema,
}) satisfies z.ZodSchema<Fares, z.ZodTypeDef, unknown>

export const TokenMessagingGasLimitsSchema = z.object({
    gasLimit: UIntBigIntSchema,
    nativeDropGasLimit: UIntBigIntSchema,
}) satisfies z.ZodSchema<TokenMessagingGasLimits, z.ZodTypeDef, unknown>

export const TokenMessagingNodeConfigSchema = MessagingNodeConfigSchema.extend({
    planner: AddressSchema.optional(),
    gasLimit: UIntBigIntSchema.optional(),
}) satisfies z.ZodSchema<TokenMessagingNodeConfig, z.ZodTypeDef, unknown>

export const TokenMessagingEdgeConfigSchema = MessagingEdgeConfigSchema.extend({
    maxPassengers: UIntNumberSchema.optional(),
    fares: FaresSchema.optional(),
    gasLimit: TokenMessagingGasLimitsSchema.optional(),
    nativeDropAmount: UIntBigIntSchema.optional(),
}) satisfies z.ZodSchema<TokenMessagingEdgeConfig, z.ZodTypeDef, unknown>

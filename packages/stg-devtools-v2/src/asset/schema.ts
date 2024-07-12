import { z } from 'zod'

import { AddressSchema, UIntNumberSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import type { AddressConfig, AssetEdgeConfig, AssetNodeConfig } from './types'

export const AddressConfigSchema = z.object({
    feeLib: AddressSchema,
    planner: AddressSchema,
    treasurer: AddressSchema,
    tokenMessaging: AddressSchema,
    creditMessaging: AddressSchema,
    lzToken: AddressSchema,
}) satisfies z.ZodSchema<AddressConfig, z.ZodTypeDef, unknown>

export const AssetNodeConfigSchema = OwnableNodeConfigSchema.extend({
    assetId: UIntNumberSchema.optional(),
    addressConfig: AddressConfigSchema.optional(),
}) satisfies z.ZodSchema<AssetNodeConfig, z.ZodTypeDef, unknown>

export const AssetEdgeConfigSchema = z.object({
    isOFT: z.boolean().optional(),
}) satisfies z.ZodSchema<AssetEdgeConfig, z.ZodTypeDef, unknown>

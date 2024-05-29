import { z } from 'zod'

import { AddressSchema, UIntNumberSchema } from '@layerzerolabs/devtools'
import { OAppEdgeConfigSchema, OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import type { MessagingAssetConfig, MessagingEdgeConfig, MessagingNodeConfig } from './types'

export const AssetIdSchema = UIntNumberSchema

export const MessagingAssetConfigSchema = z.record(AddressSchema, AssetIdSchema) satisfies z.ZodSchema<
    MessagingAssetConfig,
    z.ZodTypeDef,
    unknown
>

export const MessagingNodeConfigSchema = OwnableNodeConfigSchema.extend({
    maxAssetId: AssetIdSchema.optional(),
    assets: MessagingAssetConfigSchema.optional(),
}) satisfies z.ZodSchema<MessagingNodeConfig, z.ZodTypeDef, unknown>

export const MessagingEdgeConfigSchema = OAppEdgeConfigSchema satisfies z.ZodSchema<
    MessagingEdgeConfig,
    z.ZodTypeDef,
    unknown
>

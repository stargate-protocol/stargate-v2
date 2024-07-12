import { z } from 'zod'

import { AddressSchema, UIntBigIntSchema } from '@layerzerolabs/devtools'

import { MessagingEdgeConfigSchema, MessagingNodeConfigSchema } from '../messaging/schema'

import type { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from './types'

export const CreditMessagingNodeConfigSchema = MessagingNodeConfigSchema.extend({
    planner: AddressSchema,
}) satisfies z.ZodSchema<CreditMessagingNodeConfig, z.ZodTypeDef, unknown>

export const CreditMessagingEdgeConfigSchema = MessagingEdgeConfigSchema.extend({
    gasLimit: UIntBigIntSchema,
}) satisfies z.ZodSchema<CreditMessagingEdgeConfig, z.ZodTypeDef, unknown>

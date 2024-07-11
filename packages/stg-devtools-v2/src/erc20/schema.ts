import { z } from 'zod'

import { AddressSchema, UIntBigIntSchema } from '@layerzerolabs/devtools'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import { Allowance, AllowanceConfig, ERC20NodeConfig, MintConfig } from './types'

export const NameSchema = z.string()

export const SymbolSchema = z.string()

export const AllowancesSchema = z.record(AddressSchema, UIntBigIntSchema) satisfies z.ZodSchema<
    Allowance,
    z.ZodTypeDef,
    unknown
>

export const AllowancesConfigSchema = z.record(AddressSchema, AllowancesSchema) satisfies z.ZodSchema<
    AllowanceConfig,
    z.ZodTypeDef,
    unknown
>

export const MintConfigSchema = z.record(AddressSchema, UIntBigIntSchema) satisfies z.ZodSchema<
    MintConfig,
    z.ZodTypeDef,
    unknown
>

export const ERC20NodeConfigSchema = OwnableNodeConfigSchema.extend({
    allowance: AllowancesConfigSchema.optional(),
    mint: MintConfigSchema.optional(),
}) satisfies z.ZodSchema<ERC20NodeConfig, z.ZodTypeDef, unknown>

import { z } from 'zod'

import { AddressSchema } from '@layerzerolabs/devtools'
import { BigNumberishBigIntSchema } from '@layerzerolabs/devtools-evm'
import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'
import { OwnableNodeConfigSchema } from '@layerzerolabs/ua-devtools'

import { Allowance, AllowanceConfig, ERC20NodeConfig, MintConfig } from './types'

export const AllowancesSchema = z.record(AddressSchema, BigNumberishBigIntSchema) satisfies z.ZodSchema<
    Allowance,
    z.ZodTypeDef,
    unknown
>

export const AllowancesConfigSchema = z.record(AddressSchema, AllowancesSchema) satisfies z.ZodSchema<
    AllowanceConfig,
    z.ZodTypeDef,
    unknown
>

export const MintConfigSchema = z.record(AddressSchema, BigNumberishBigIntSchema) satisfies z.ZodSchema<
    MintConfig,
    z.ZodTypeDef,
    unknown
>

export const ERC20NodeConfigSchema = OwnableNodeConfigSchema.extend({
    allowance: AllowancesConfigSchema.optional(),
    mint: MintConfigSchema.optional(),
}) satisfies z.ZodSchema<ERC20NodeConfig, z.ZodTypeDef, unknown>

export const ERC20OmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(ERC20NodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

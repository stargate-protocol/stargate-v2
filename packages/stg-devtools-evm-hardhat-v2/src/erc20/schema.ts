import { ERC20NodeConfigSchema } from '@stargatefinance/stg-devtools-v2'
import { z } from 'zod'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const ERC20OmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(ERC20NodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

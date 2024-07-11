import { TreasurerNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'
import { z } from 'zod'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const TreasurerOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(TreasurerNodeConfigSchema),
    createOmniEdgeHardhatSchema(z.unknown())
)

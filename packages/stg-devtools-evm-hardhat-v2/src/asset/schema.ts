import { AssetEdgeConfigSchema, AssetNodeConfigSchema } from '@stargatefinance/stg-devtools-v2'

import {
    createOmniEdgeHardhatSchema,
    createOmniGraphHardhatSchema,
    createOmniNodeHardhatSchema,
} from '@layerzerolabs/devtools-evm-hardhat'

export const AssetOmniGraphHardhatSchema = createOmniGraphHardhatSchema(
    createOmniNodeHardhatSchema(AssetNodeConfigSchema),
    createOmniEdgeHardhatSchema(AssetEdgeConfigSchema)
)

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildAssetDeploymentGraphTestnet } from './utils'

const tokenName = TokenName.USDC

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    return buildAssetDeploymentGraphTestnet(tokenName)
}

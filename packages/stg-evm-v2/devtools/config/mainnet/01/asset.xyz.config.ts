import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../src/asset/utils'
import { generateAssetConfig } from '../../utils'

// The planner is an account that can perform credit & fee management and needs to be set to a desired value
import { DEFAULT_PLANNER } from './constants'

import type { AssetEdgeConfig, AssetNodeConfig } from '../../../src/asset'

// The configured token identifier
const tokenName = TokenName.XYZ

const getAssetPoint = createGetAssetOmniPoint(tokenName)
const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

export default async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // Now we define all the contracts
    //
    // For a complete configuration, this list needs to match the asset network configuration
    // defined in stg-definitions-v2
    const avaxPoint = getAssetPoint(EndpointId.AVALANCHE_V2_MAINNET)
    const ethPoint = getAssetPoint(EndpointId.ETHEREUM_V2_MAINNET)

    // The asset configuration is abstracted and based on the account configuration in hardhat config
    // and the configuration in stg-definitions-v2
    const avaxContract = await getAssetNode(avaxPoint)
    const ethContract = await getAssetNode(ethPoint)

    return {
        contracts: [avaxContract, ethContract],
        connections: generateAssetConfig(tokenName, [avaxPoint, ethPoint]),
    }
}

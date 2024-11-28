import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../ts-src/utils/util'

import { onBL3 } from './utils'

const fiatContract = { contractName: 'TetherTokenV2' }

// For external USDT deployments
const usdtBL3Asset = getAssetNetworkConfig(EndpointId.BL3_V2_TESTNET, TokenName.USDT)
assert(usdtBL3Asset.address != null, `External USDT address not found for PEAQ`)

export default async (): Promise<OmniGraphHardhat<OwnableNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const bl3USDTProxy = await contractFactory(
        onBL3({ contractName: 'TransparentUpgradeableProxy', address: usdtBL3Asset.address })
    )

    const bl3USDT = onBL3({ ...fiatContract, address: bl3USDTProxy.contract.address })

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const usdtAssets = [TokenName.USDT] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const bl3AssetAddresses = await getAssetAddresses(EndpointId.BL3_V2_TESTNET, usdtAssets)

    return {
        contracts: [
            // Will fail on github ci/cd because of the external deployment -- already configured correctly
            // {
            //     contract: bl3USDT,
            //     config: {
            //         owner: bl3AssetAddresses.USDT,
            //     },
            // },
        ],
        connections: [],
    }
}

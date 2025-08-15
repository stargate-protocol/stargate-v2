import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../ts-src/utils/util'

import { onOdyssey } from './utils'

const fiatContract = { contractName: 'TetherTokenV2' }

// For external USDT deployments
const usdtOdysseyAsset = getAssetNetworkConfig(EndpointId.ODYSSEY_V2_TESTNET, TokenName.USDT)
assert(usdtOdysseyAsset.address != null, `External USDC address not found for Odyssey`)

export default async (): Promise<OmniGraphHardhat<OwnableNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const odysseyUSDTProxy = await contractFactory(
        onOdyssey({ contractName: 'TransparentUpgradeableProxy', address: usdtOdysseyAsset.address })
    )

    const odysseyUSDT = onOdyssey({ ...fiatContract, address: odysseyUSDTProxy.contract.address })

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const usdtAssets = [TokenName.USDT] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const odysseyAssetAddresses = await getAssetAddresses(EndpointId.ODYSSEY_V2_TESTNET, usdtAssets)

    return {
        contracts: [
            // Will fail on github ci/cd because of the external deployment -- already configured correctly
            {
                contract: odysseyUSDT,
                config: {
                    owner: odysseyAssetAddresses.USDT,
                },
            },
        ],
        connections: [],
    }
}

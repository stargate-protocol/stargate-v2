import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import { onPeaq } from '../utils'

const fiatContract = { contractName: 'FiatTokenV2_2' }

// For external USDT deployments
const usdtPeaqAsset = getAssetNetworkConfig(EndpointId.PEAQ_V2_MAINNET, TokenName.USDT)
assert(usdtPeaqAsset.address != null, `External USDT address not found for PEAQ`)

// TODO change USDCNodeConfig to USDTNodeConfig, but that does not yet exist
export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const peaqUSDTProxy = await contractFactory(
        onPeaq({ contractName: 'FiatTokenProxy', address: usdtPeaqAsset.address })
    )

    const peaqUSDT = onPeaq({ ...fiatContract, address: peaqUSDTProxy.contract.address })

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const usdtAssets = [TokenName.USDT] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const peaqAssetAddresses = await getAssetAddresses(EndpointId.PEAQ_V2_MAINNET, usdtAssets)

    return {
        contracts: [
            {
                contract: peaqUSDT,
                config: {
                    owner: peaqAssetAddresses.USDT,
                },
            },
        ],
        connections: [],
    }
}

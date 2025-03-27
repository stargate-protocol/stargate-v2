import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../ops/util'
import { createGetAssetAddresses, getAssetNetworkConfig, getNamedAccount } from '../../../ts-src/utils/util'

import { onKlaytn, onOdyssey } from './utils'

const getStargateMultisig = getNamedAccount('usdcAdmin')

// Except for external deployments

const usdcOdysseyAsset = getAssetNetworkConfig(EndpointId.ODYSSEY_V2_TESTNET, TokenName.USDC)
assert(usdcOdysseyAsset.address != null, `External USDC address not found for Odyssey`)

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const klaytnUSDCProxy = await contractFactory(onKlaytn({ contractName: getUSDCProxyDeployName() }))
    const odysseyUSDCProxy = await contractFactory(
        onOdyssey({ contractName: 'FiatTokenProxy', address: usdcOdysseyAsset.address })
    )

    // Get the corresponding underlying USDC contract
    const klaytnUSDC = onKlaytn({ contractName: 'FiatTokenV2_2', address: klaytnUSDCProxy.contract.address })
    const odysseyUSDC = onOdyssey({ contractName: 'FiatTokenV2_2', address: odysseyUSDCProxy.contract.address })

    const klaytn = await getEnvironment(EndpointId.KLAYTN_V2_TESTNET)
    const klaytnStargateMultisig = await klaytn.getNamedAccounts().then(getStargateMultisig)

    const odyssey = await getEnvironment(EndpointId.ODYSSEY_V2_TESTNET)
    const odysseyStargateMultisig = await odyssey.getNamedAccounts().then(getStargateMultisig)

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const assets = [TokenName.USDC] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_TESTNET, assets)
    const odysseyAssetAddresses = await getAssetAddresses(EndpointId.ODYSSEY_V2_TESTNET, assets)

    return {
        contracts: [
            {
                contract: klaytnUSDC,
                config: {
                    masterMinter: klaytnStargateMultisig,
                    pauser: klaytnStargateMultisig,
                    rescuer: klaytnStargateMultisig,
                    blacklister: klaytnStargateMultisig,
                    minters: {
                        [klaytnAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            // Will fail on github ci/cd because of the external deployment -- already configured correctly
            // {
            //     contract: odysseyUSDC,
            //     config: {
            //         masterMinter: odysseyStargateMultisig,
            //         pauser: odysseyStargateMultisig,
            //         rescuer: odysseyStargateMultisig,
            //         blacklister: odysseyStargateMultisig,
            //         minters: {
            //             [odysseyAssetAddresses.USDC]: 2n ** 256n - 1n,
            //         },
            //     },
            // },
        ],
        connections: [],
    }
}

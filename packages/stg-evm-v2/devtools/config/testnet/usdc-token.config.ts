import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../ops/util'
import { createGetAssetAddresses, getAssetNetworkConfig, getNamedAccount } from '../../../ts-src/utils/util'

import { onAbs, onBL3, onKlaytn, onOdyssey } from './utils'

const getStargateMultisig = getNamedAccount('usdcAdmin')

// Except for external deployments
const usdcBL3Asset = getAssetNetworkConfig(EndpointId.BL3_V2_TESTNET, TokenName.USDC)
assert(usdcBL3Asset.address != null, `External USDC address not found for BL3`)

const usdcOdysseyAsset = getAssetNetworkConfig(EndpointId.ODYSSEY_V2_TESTNET, TokenName.USDC)
assert(usdcOdysseyAsset.address != null, `External USDC address not found for Odyssey`)

const usdcAbsAsset = getAssetNetworkConfig(EndpointId.ABSTRACT_V2_TESTNET, TokenName.USDC)
assert(usdcAbsAsset.address != null, `External USDC address not found for Abstract`)

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const klaytnUSDCProxy = await contractFactory(onKlaytn({ contractName: getUSDCProxyDeployName() }))
    const bl3USDCProxy = await contractFactory(onBL3({ contractName: 'FiatTokenProxy', address: usdcBL3Asset.address }))
    const odysseyUSDCProxy = await contractFactory(
        onOdyssey({ contractName: 'FiatTokenProxy', address: usdcOdysseyAsset.address })
    )
    const absUSDCProxy = await contractFactory(onAbs({ contractName: 'FiatTokenProxy', address: usdcAbsAsset.address }))

    // Get the corresponding underlying USDC contract
    const klaytnUSDC = onKlaytn({ contractName: 'FiatTokenV2_2', address: klaytnUSDCProxy.contract.address })
    const bl3USDC = onBL3({ contractName: 'FiatTokenV2_2', address: bl3USDCProxy.contract.address })
    const odysseyUSDC = onOdyssey({ contractName: 'FiatTokenV2_2', address: odysseyUSDCProxy.contract.address })
    const absUSDC = onAbs({ contractName: 'FiatTokenV2_2', address: absUSDCProxy.contract.address })

    const klaytn = await getEnvironment(EndpointId.KLAYTN_V2_TESTNET)
    const klaytnStargateMultisig = await klaytn.getNamedAccounts().then(getStargateMultisig)

    const bl3 = await getEnvironment(EndpointId.BL3_V2_TESTNET)
    const bl3StargateMultisig = await bl3.getNamedAccounts().then(getStargateMultisig)

    const odyssey = await getEnvironment(EndpointId.ODYSSEY_V2_TESTNET)
    const odysseyStargateMultisig = await odyssey.getNamedAccounts().then(getStargateMultisig)

    const abs = await getEnvironment(EndpointId.ABSTRACT_V2_TESTNET)
    const absStargateMultisig = await abs.getNamedAccounts().then(getStargateMultisig)

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const assets = [TokenName.USDC] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_TESTNET, assets)
    const bl3AssetAddresses = await getAssetAddresses(EndpointId.BL3_V2_TESTNET, assets)
    const odysseyAssetAddresses = await getAssetAddresses(EndpointId.ODYSSEY_V2_TESTNET, assets)
    const absAssetAddresses = await getAssetAddresses(EndpointId.ABSTRACT_V2_TESTNET, assets)

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
            //     contract: bl3USDC,
            //     config: {
            //         masterMinter: bl3StargateMultisig,
            //         pauser: bl3StargateMultisig,
            //         rescuer: bl3StargateMultisig,
            //         blacklister: bl3StargateMultisig,
            //         minters: {
            //             [bl3AssetAddresses.USDC]: 2n ** 256n - 1n,
            //         },
            //     },
            // },
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
            {
                contract: absUSDC,
                config: {
                    masterMinter: absStargateMultisig,
                    pauser: absStargateMultisig,
                    rescuer: absStargateMultisig,
                    blacklister: absStargateMultisig,
                    minters: {
                        [absAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
        ],
        connections: [],
    }
}

import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../ops/util'
import { createGetAssetAddresses, getAssetNetworkConfig, getNamedAccount } from '../../../ts-src/utils/util'

import { onAbs, onKlaytn } from './utils'

const getStargateMultisig = getNamedAccount('usdcAdmin')

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const klaytnUSDCProxy = await contractFactory(onKlaytn({ contractName: getUSDCProxyDeployName() }))
    // Except for peaq because it is externally deployed
    const usdcAbsAsset = getAssetNetworkConfig(EndpointId.ABSTRACT_V2_TESTNET, TokenName.USDC)
    assert(usdcAbsAsset.address != null, `External USDC address not found for Abstract Testnet`)
    const absUSDCProxy = await contractFactory(onAbs({ contractName: 'FiatTokenProxy', address: usdcAbsAsset.address }))

    // Get the corresponding underlying USDC contract
    const klaytnUSDC = onKlaytn({ contractName: 'FiatTokenV2_2', address: klaytnUSDCProxy.contract.address })
    const absUSDC = onAbs({ contractName: 'FiatTokenV2_2', address: absUSDCProxy.contract.address })

    const klaytn = await getEnvironment(EndpointId.KLAYTN_V2_TESTNET)
    const klaytnStargateMultisig = await klaytn.getNamedAccounts().then(getStargateMultisig)

    const abs = await getEnvironment(EndpointId.ABSTRACT_V2_TESTNET)
    const absStargateMultisig = await abs.getNamedAccounts().then(getStargateMultisig)

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const assets = [TokenName.USDC] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_TESTNET, assets)
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

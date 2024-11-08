import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../ops/util'
import { getAssetNetworkConfig, getNamedAccount } from '../../../ts-src/utils/util'

import { onAbs, onKlaytn } from './utils'

const getUSDCStargateMultisig = getNamedAccount('usdcAdmin')

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // Get the corresponding underlying USDC contract
    const klaytnUSDC = onKlaytn({ contractName: getUSDCProxyDeployName() })

    // Except for Peaq where it's deployed externally
    const usdcAbsAsset = getAssetNetworkConfig(EndpointId.ABSTRACT_V2_TESTNET, TokenName.USDC)
    assert(usdcAbsAsset.address != null, `External USDC address not found for Abstract Testnet`)
    const absUSDC = onAbs({ contractName: 'FiatTokenProxy', address: usdcAbsAsset.address })

    const klaytn = await getEnvironment(EndpointId.KLAYTN_V2_TESTNET)
    const klaytnStargateMultisig = await klaytn.getNamedAccounts().then(getUSDCStargateMultisig)

    const abs = await getEnvironment(EndpointId.ABSTRACT_V2_TESTNET)
    const absStargateMultisig = await abs.getNamedAccounts().then(getUSDCStargateMultisig)

    return {
        contracts: [
            //
            // Klaytn
            //
            {
                contract: klaytnUSDC,
                config: {
                    admin: klaytnStargateMultisig,
                },
            },
            //
            // Abstract
            //
            {
                contract: absUSDC,
                config: {
                    admin: absStargateMultisig,
                },
            },
        ],
        connections: [],
    }
}

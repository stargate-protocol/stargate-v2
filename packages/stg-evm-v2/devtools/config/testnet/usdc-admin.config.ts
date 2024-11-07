import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getNamedAccount } from '../../../ts-src/utils/util'

const getUSDCStargateMultisig = getNamedAccount('usdcAdmin')

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    // const getEnvironment = createGetHreByEid()

    // // Get the corresponding underlying USDC contract
    // const klaytnUSDC = onKlaytn({ contractName: getUSDCProxyDeployName() })
    // // const absUSDC = onAbs({ contractName: getUSDCProxyDeployName() })

    // const klaytn = await getEnvironment(EndpointId.KLAYTN_V2_TESTNET)
    // const klaytnStargateMultisig = await klaytn.getNamedAccounts().then(getUSDCStargateMultisig)

    // const abs = await getEnvironment(EndpointId.ABSTRACT_V2_TESTNET)
    // const absStargateMultisig = await abs.getNamedAccounts().then(getUSDCStargateMultisig)

    return {
        contracts: [
            //
            // Klaytn
            //
            // {
            //     contract: klaytnUSDC,
            //     config: {
            //         admin: klaytnStargateMultisig,
            //     },
            // },
            // //
            // // Abstract
            // //
            // {
            //     contract: absUSDC,
            //     config: {
            //         admin: absStargateMultisig,
            //     },
            // },
        ],
        connections: [],
    }
}

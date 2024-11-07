import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../ops/util'
import { getNamedAccount } from '../../../ts-src/utils/util'

import { onKlaytn } from './utils'

const getUSDCStargateMultisig = getNamedAccount('usdcAdmin')

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // Get the corresponding underlying USDC contract
    const klaytnUSDC = onKlaytn({ contractName: getUSDCProxyDeployName() })

    const klaytn = await getEnvironment(EndpointId.KLAYTN_V2_TESTNET)
    const klaytnStargateMultisig = await klaytn.getNamedAccounts().then(getUSDCStargateMultisig)

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
        ],
        connections: [],
    }
}

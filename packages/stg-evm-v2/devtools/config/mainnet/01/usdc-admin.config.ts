import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../../ops/util'
import { USDCNodeConfig } from '../../../src/usdc'
import { getSafeAddress } from '../../utils'
import { onKlaytn, onRarible } from '../utils'

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // Get the corresponding underlying USDC contract
    const klaytnUSDC = onKlaytn({ contractName: getUSDCProxyDeployName() })
    const raribleUSDC = onRarible({ contractName: getUSDCProxyDeployName() })

    const klaytnStargateMultisig = getSafeAddress(EndpointId.KLAYTN_V2_MAINNET)
    const raribleStargateMultisig = getSafeAddress(EndpointId.RARIBLE_V2_MAINNET)

    return {
        contracts: [
            {
                contract: klaytnUSDC,
                config: {
                    admin: klaytnStargateMultisig,
                },
            },
            {
                contract: raribleUSDC,
                config: {
                    admin: raribleStargateMultisig,
                },
            },
        ],
        connections: [],
    }
}

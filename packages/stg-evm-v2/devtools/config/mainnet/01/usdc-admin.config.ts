import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../../ops/util'
import { USDCNodeConfig } from '../../../src/usdc'
import { getSafeAddress } from '../../utils'
import { onIota, onKlaytn, onRarible } from '../utils'

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // Get the corresponding underlying USDC contract
    const iotaUSDC = onIota({ contractName: getUSDCProxyDeployName() })
    const klaytnUSDC = onKlaytn({ contractName: getUSDCProxyDeployName() })
    const raribleUSDC = onRarible({ contractName: getUSDCProxyDeployName() })

    const iotaStargateMultisig = getSafeAddress(EndpointId.IOTA_V2_MAINNET)
    const klaytnStargateMultisig = getSafeAddress(EndpointId.KLAYTN_V2_MAINNET)
    const raribleStargateMultisig = getSafeAddress(EndpointId.RARIBLE_V2_MAINNET)

    return {
        contracts: [
            {
                contract: iotaUSDC,
                config: {
                    admin: iotaStargateMultisig,
                },
            },
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

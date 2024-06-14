import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../../ops/util'
import { USDCNodeConfig } from '../../../src/usdc'
import { getSafeAddress } from '../../utils'
import { onIota, onKlaytn, onRarible, onTaiko, onXchain } from '../utils'

const proxyContract = { contractName: getUSDCProxyDeployName() }

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // Get the corresponding underlying USDC contract
    const iotaUSDC = onIota(proxyContract)
    const klaytnUSDC = onKlaytn(proxyContract)
    const raribleUSDC = onRarible(proxyContract)
    const taikoUSDC = onTaiko(proxyContract)
    const xchainUSDC = onXchain(proxyContract)

    const iotaStargateMultisig = getSafeAddress(EndpointId.IOTA_V2_MAINNET)
    const klaytnStargateMultisig = getSafeAddress(EndpointId.KLAYTN_V2_MAINNET)
    const raribleStargateMultisig = getSafeAddress(EndpointId.RARIBLE_V2_MAINNET)
    const taikoStargateMultisig = getSafeAddress(EndpointId.TAIKO_V2_MAINNET)
    const xchainStargateMultisig = getSafeAddress(EndpointId.XCHAIN_V2_MAINNET)

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
            {
                contract: taikoUSDC,
                config: {
                    admin: taikoStargateMultisig,
                },
            },
            {
                contract: xchainUSDC,
                config: {
                    admin: xchainStargateMultisig,
                },
            },
        ],
        connections: [],
    }
}

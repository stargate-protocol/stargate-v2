import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../ops/util'
import { getNamedAccount } from '../../../ts-src/utils/util'

import { onBsc, onEth, onPolygon } from './utils'

const getUSDCStargateMultisig = getNamedAccount('usdcAdmin')

// USDC Deployment name is the same for all chains
const contract = { contractName: getUSDCProxyDeployName() }

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // Get the corresponding underlying USDC contract
    const ethUSDC = onEth(contract)
    const polygonUSDC = onPolygon(contract)
    const bscUSDC = onBsc(contract)

    const eth = await getEnvironment(EndpointId.ETHEREUM_V2_SANDBOX)
    const ethStargateMultisig = await eth.getNamedAccounts().then(getUSDCStargateMultisig)
    const polygon = await getEnvironment(EndpointId.POLYGON_V2_SANDBOX)
    const polygonStargateMultisig = await polygon.getNamedAccounts().then(getUSDCStargateMultisig)
    const bsc = await getEnvironment(EndpointId.BSC_V2_SANDBOX)
    const bscStargateMultisig = await bsc.getNamedAccounts().then(getUSDCStargateMultisig)

    return {
        contracts: [
            //
            // ETHEREUM
            //
            {
                contract: ethUSDC,
                config: {
                    admin: ethStargateMultisig,
                },
            },
            //
            // POLYGON
            //
            {
                contract: polygonUSDC,
                config: {
                    admin: polygonStargateMultisig,
                },
            },
            //
            // BSC
            //
            {
                contract: bscUSDC,
                config: {
                    admin: bscStargateMultisig,
                },
            },
        ],
        connections: [],
    }
}

import { PoolNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getNamedAccount } from '../../../ts-src/utils/util'

import { onEth, onPolygon } from './utils'

const getDeployer = getNamedAccount('deployer')
export default async (): Promise<OmniGraphHardhat<PoolNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const eth = await getEnvironment(EndpointId.ETHEREUM_V2_SANDBOX)
    const polygon = await getEnvironment(EndpointId.POLYGON_V2_SANDBOX)

    // Then grab the deployer account for each network to be used as the admin
    const ethAdmin = await eth.getNamedAccounts().then(getDeployer)
    const polygonAdmin = await polygon.getNamedAccounts().then(getDeployer)

    const nativePool = { contractName: 'StargatePoolNative' }
    const usdcPool = { contractName: 'StargatePoolUSDC' }
    const usdtPool = { contractName: 'StargatePoolUSDT' }

    return {
        contracts: [
            {
                contract: onEth(nativePool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(18e18),
                    },
                    isNative: true,
                },
            },
            {
                contract: onEth(usdcPool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onEth(usdtPool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onPolygon(usdtPool),
                config: {
                    depositAmount: {
                        [polygonAdmin]: BigInt(18e18),
                    },
                },
            },
        ],
        connections: [],
    }
}

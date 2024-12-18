import { PoolNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getNamedAccount } from '../../../ts-src/utils/util'

import { onArb, onBsc, onEth, onOpt } from './utils'

const getDeployer = getNamedAccount('deployer')
export default async (): Promise<OmniGraphHardhat<PoolNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const eth = await getEnvironment(EndpointId.SEPOLIA_V2_TESTNET)

    // Then grab the deployer account for each network to be used as the admin
    const ethAdmin = await eth.getNamedAccounts().then(getDeployer)

    const nativePool = { contractName: 'StargatePoolNative' }
    const usdcPool = { contractName: 'StargatePoolUSDC' }
    const usdtPool = { contractName: 'StargatePoolUSDT' }

    return {
        contracts: [
            {
                contract: onEth(nativePool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(1e18),
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
                contract: onOpt(nativePool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(1e18),
                    },
                    isNative: true,
                },
            },
            {
                contract: onOpt(usdcPool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onOpt(usdtPool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onArb(nativePool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(1e18),
                    },
                    isNative: true,
                },
            },
            {
                contract: onArb(usdtPool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onArb(usdcPool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
            {
                contract: onBsc(usdtPool),
                config: {
                    depositAmount: {
                        [ethAdmin]: BigInt(18e18),
                    },
                },
            },
        ],
        connections: [],
    }
}

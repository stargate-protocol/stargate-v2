import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../ops/util'
import { createGetAssetAddresses, getNamedAccount } from '../../../ts-src/utils/util'

import { OFFCHAIN_MINTER } from './constants'
import { onBsc, onEth, onPolygon } from './utils'

const getStargateMultisig = getNamedAccount('usdcAdmin')

// USDC Deployment name is the same for all chains
const contract = { contractName: getUSDCProxyDeployName() }

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const ethUSDCProxy = await contractFactory(onEth(contract))
    const polygonUSDCProxy = await contractFactory(onPolygon(contract))
    const bscUSDCProxy = await contractFactory(onBsc(contract))

    // Get the corresponding underlying USDC contract
    const ethUSDC = onEth({ contractName: 'FiatTokenV2_2', address: ethUSDCProxy.contract.address })
    const polygonUSDC = onPolygon({ contractName: 'FiatTokenV2_2', address: polygonUSDCProxy.contract.address })
    const bscUSDC = onBsc({ contractName: 'FiatTokenV2_2', address: bscUSDCProxy.contract.address })

    const eth = await getEnvironment(EndpointId.ETHEREUM_V2_SANDBOX)
    const ethStargateMultisig = await eth.getNamedAccounts().then(getStargateMultisig)
    const polygon = await getEnvironment(EndpointId.POLYGON_V2_SANDBOX)
    const polygonStargateMultisig = await polygon.getNamedAccounts().then(getStargateMultisig)
    const bsc = await getEnvironment(EndpointId.BSC_V2_SANDBOX)
    const bscStargateMultisig = await bsc.getNamedAccounts().then(getStargateMultisig)

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const assets = [TokenName.USDC] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const ethAssetAddresses = await getAssetAddresses(EndpointId.ETHEREUM_V2_SANDBOX, assets)
    const polygonAssetAddresses = await getAssetAddresses(EndpointId.POLYGON_V2_SANDBOX, assets)
    const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_SANDBOX, assets)

    return {
        contracts: [
            //
            // ETHEREUM
            //
            {
                contract: ethUSDC,
                config: {
                    owner: ethStargateMultisig,
                    masterMinter: ethStargateMultisig,
                    pauser: ethStargateMultisig,
                    rescuer: ethStargateMultisig,
                    blacklister: ethStargateMultisig,
                    minters: {
                        [ethAssetAddresses.USDC]: 2n ** 256n - 1n,
                        [OFFCHAIN_MINTER]: 2n ** 256n - 1n,
                    },
                },
            },
            //
            // POLYGON
            //
            {
                contract: polygonUSDC,
                config: {
                    owner: polygonStargateMultisig,
                    masterMinter: polygonStargateMultisig,
                    pauser: polygonStargateMultisig,
                    rescuer: polygonStargateMultisig,
                    blacklister: polygonStargateMultisig,
                    minters: {
                        [polygonAssetAddresses.USDC]: 2n ** 256n - 1n,
                        [OFFCHAIN_MINTER]: 2n ** 256n - 1n,
                    },
                },
            },
            //
            // BSC
            //
            {
                contract: bscUSDC,
                config: {
                    owner: bscStargateMultisig,
                    masterMinter: bscStargateMultisig,
                    pauser: bscStargateMultisig,
                    rescuer: bscStargateMultisig,
                    blacklister: bscStargateMultisig,
                    minters: {
                        [bscAssetAddresses.USDC]: 2n ** 256n - 1n,
                        [OFFCHAIN_MINTER]: 2n ** 256n - 1n,
                    },
                },
            },
        ],
        connections: [],
    }
}

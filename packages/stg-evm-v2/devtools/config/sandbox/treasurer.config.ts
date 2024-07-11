import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { TreasurerNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses, getNamedAccount } from '../../../ts-src/utils/util'

import { onBsc, onEth, onPolygon } from './utils'

const contract = { contractName: 'Treasurer' }
const getDeployer = getNamedAccount('deployer')

export default async (): Promise<OmniGraphHardhat<TreasurerNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const bsc = await getEnvironment(EndpointId.BSC_V2_SANDBOX)
    const eth = await getEnvironment(EndpointId.ETHEREUM_V2_SANDBOX)
    const polygon = await getEnvironment(EndpointId.POLYGON_V2_SANDBOX)

    // Then grab the deployer account for each network to be used as the admin
    const bscAdmin = await bsc.getNamedAccounts().then(getDeployer)
    const ethAdmin = await eth.getNamedAccounts().then(getDeployer)
    const polygonAdmin = await polygon.getNamedAccounts().then(getDeployer)

    // Now we collect the address of the deployed assets
    const assets = [TokenName.ETH, TokenName.USDC, TokenName.USDT] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const ethAssetAddresses = await getAssetAddresses(EndpointId.ETHEREUM_V2_SANDBOX, assets)
    const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_SANDBOX, [TokenName.USDC, TokenName.USDT])
    const polygonAssetAddresses = await getAssetAddresses(EndpointId.POLYGON_V2_SANDBOX, assets)

    return {
        contracts: [
            {
                contract: onEth(contract),
                config: {
                    admin: ethAdmin,
                    assets: {
                        [ethAssetAddresses.ETH]: true,
                        [ethAssetAddresses.USDC]: true,
                        [ethAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onBsc(contract),
                config: {
                    admin: bscAdmin,
                    assets: {
                        [bscAssetAddresses.USDC]: true,
                        [bscAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onPolygon(contract),
                config: {
                    admin: polygonAdmin,
                    assets: {
                        [polygonAssetAddresses.ETH]: true,
                        [polygonAssetAddresses.USDC]: true,
                        [polygonAssetAddresses.USDT]: true,
                    },
                },
            },
        ],
        connections: [],
    }
}

import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'
import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses } from '../../../ts-src/utils/util'
import { generateTokenMessagingConfig } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { onBsc, onEth, onPolygon } from './utils'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    const getEnvironment = createGetHreByEid()

    const ethTokenMsging = onEth(contract)
    const bscTokenMsging = onBsc(contract)
    const polygonTokenMsging = onPolygon(contract)

    const defaultNodeConfig: TokenMessagingNodeConfig = {
        planner: DEFAULT_PLANNER,
    }

    // Now we collect the address of the deployed assets
    const assets = [TokenName.USDC, TokenName.USDT, TokenName.ETH] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const ethAssetAddresses = await getAssetAddresses(EndpointId.ETHEREUM_V2_SANDBOX, assets)
    const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_SANDBOX, [TokenName.USDC, TokenName.USDT])
    const polygonAssetAddresses = await getAssetAddresses(EndpointId.POLYGON_V2_SANDBOX, assets)

    return {
        contracts: [
            {
                contract: ethTokenMsging,
                config: {
                    ...defaultNodeConfig,
                    assets: {
                        [ethAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [ethAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                        [ethAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
                    },
                },
            },
            {
                contract: bscTokenMsging,
                config: {
                    ...defaultNodeConfig,
                    assets: {
                        [bscAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                    },
                },
            },
            {
                contract: polygonTokenMsging,
                config: {
                    ...defaultNodeConfig,
                    assets: {
                        [polygonAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [polygonAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                        [polygonAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
                    },
                },
            },
        ],
        connections: generateTokenMessagingConfig([ethTokenMsging, bscTokenMsging, polygonTokenMsging]),
    }
}

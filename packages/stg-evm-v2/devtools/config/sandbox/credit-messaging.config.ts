import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'
import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses } from '../../../ts-src/utils/util'
import { generateCreditMessagingConfig } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { onBsc, onEth, onPolygon } from './utils'

const contract = { contractName: 'CreditMessaging' }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const bscCreditMsging = onBsc(contract)
    const ethCreditMsging = onEth(contract)
    const polygonCreditMsging = onPolygon(contract)

    // Now we collect the address of the deployed assets
    const assets = [TokenName.USDC, TokenName.USDT, TokenName.ETH] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_SANDBOX, [TokenName.USDC, TokenName.USDT])
    const ethAssetAddresses = await getAssetAddresses(EndpointId.ETHEREUM_V2_SANDBOX, assets)
    const polygonAssetAddresses = await getAssetAddresses(EndpointId.POLYGON_V2_SANDBOX, assets)

    return {
        contracts: [
            {
                contract: bscCreditMsging,
                config: {
                    planner: DEFAULT_PLANNER,
                    assets: {
                        [bscAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [bscAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                    },
                },
            },
            {
                contract: ethCreditMsging,
                config: {
                    planner: DEFAULT_PLANNER,
                    assets: {
                        [ethAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [ethAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                        [ethAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
                    },
                },
            },
            {
                contract: polygonCreditMsging,
                config: {
                    planner: DEFAULT_PLANNER,
                    assets: {
                        [polygonAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [polygonAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                        [polygonAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
                    },
                },
            },
        ],
        connections: generateCreditMessagingConfig([bscCreditMsging, ethCreditMsging, polygonCreditMsging]),
    }
}

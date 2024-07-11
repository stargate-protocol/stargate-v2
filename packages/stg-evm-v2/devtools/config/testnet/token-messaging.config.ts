import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'
import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses } from '../../../ts-src/utils/util'
import { generateTokenMessagingConfig } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { onArb, onBsc, onEth, onKlaytn, onOpt } from './utils'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    const getEnvironment = createGetHreByEid()

    const ethTokenMsging = onEth(contract)
    const bscTokenMsging = onBsc(contract)
    const optTokenMsging = onOpt(contract)
    const arbTokenMsging = onArb(contract)
    const klaytnTokenMsging = onKlaytn(contract)

    const defaultNodeConfig: TokenMessagingNodeConfig = {
        planner: DEFAULT_PLANNER,
    }

    // Now we collect the address of the deployed assets
    const allAssets = [TokenName.USDT, TokenName.USDC, TokenName.ETH] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const ethAssetAddresses = await getAssetAddresses(EndpointId.SEPOLIA_V2_TESTNET, allAssets)
    const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_TESTNET, [TokenName.USDT] as const)
    const optAssetAddresses = await getAssetAddresses(EndpointId.OPTSEP_V2_TESTNET, allAssets)
    const arbAssetAddresses = await getAssetAddresses(EndpointId.ARBSEP_V2_TESTNET, allAssets)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_TESTNET, allAssets)

    return {
        contracts: [
            {
                contract: ethTokenMsging,
                config: {
                    ...defaultNodeConfig,
                    assets: {
                        [ethAssetAddresses.USDT]: ASSETS.USDT.assetId,
                        [ethAssetAddresses.USDC]: ASSETS.USDC.assetId,
                        [ethAssetAddresses.ETH]: ASSETS.ETH.assetId,
                    },
                },
            },
            {
                contract: bscTokenMsging,
                config: {
                    ...defaultNodeConfig,
                    assets: {
                        [bscAssetAddresses.USDT]: ASSETS.USDT.assetId,
                    },
                },
            },
            {
                contract: optTokenMsging,
                config: {
                    ...defaultNodeConfig,
                    assets: {
                        [optAssetAddresses.USDT]: ASSETS.USDT.assetId,
                        [optAssetAddresses.USDC]: ASSETS.USDC.assetId,
                        [optAssetAddresses.ETH]: ASSETS.ETH.assetId,
                    },
                },
            },
            {
                contract: arbTokenMsging,
                config: {
                    ...defaultNodeConfig,
                    assets: {
                        [arbAssetAddresses.USDT]: ASSETS.USDT.assetId,
                        [arbAssetAddresses.USDC]: ASSETS.USDC.assetId,
                        [arbAssetAddresses.ETH]: ASSETS.ETH.assetId,
                    },
                },
            },
            {
                contract: klaytnTokenMsging,
                config: {
                    ...defaultNodeConfig,
                    assets: {
                        [klaytnAssetAddresses.USDT]: ASSETS.USDT.assetId,
                        [klaytnAssetAddresses.USDC]: ASSETS.USDC.assetId,
                        [klaytnAssetAddresses.ETH]: ASSETS.ETH.assetId,
                    },
                },
            },
        ],
        connections: generateTokenMessagingConfig([
            ethTokenMsging,
            bscTokenMsging,
            optTokenMsging,
            arbTokenMsging,
            klaytnTokenMsging,
        ]),
    }
}

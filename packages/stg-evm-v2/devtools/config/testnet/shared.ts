import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'
import { MessagingAssetConfig } from '@stargatefinance/stg-devtools-v2'

import { createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses } from '../../../ts-src/utils/util'

export const getMessagingAssetConfig = async (getEnvironment = createGetHreByEid()) => {
    const allAssets = [TokenName.USDT, TokenName.USDC, TokenName.ETH] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    const arbAssetAddresses = await getAssetAddresses(EndpointId.ARBSEP_V2_TESTNET, allAssets)
    const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_TESTNET, [TokenName.USDT] as const)
    const ethAssetAddresses = await getAssetAddresses(EndpointId.SEPOLIA_V2_TESTNET, allAssets)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_TESTNET, allAssets)
    const mantleAssetAddresses = await getAssetAddresses(EndpointId.MANTLESEP_V2_TESTNET, allAssets)
    const optAssetAddresses = await getAssetAddresses(EndpointId.OPTSEP_V2_TESTNET, allAssets)
    const odysseyAssetAddresses = await getAssetAddresses(EndpointId.ODYSSEY_V2_TESTNET, allAssets)

    return {
        [EndpointId.ARBSEP_V2_TESTNET]: {
            [arbAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [arbAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [arbAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.BSC_V2_TESTNET]: {
            [bscAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.SEPOLIA_V2_TESTNET]: {
            [ethAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [ethAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [ethAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.KLAYTN_V2_TESTNET]: {
            [klaytnAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [klaytnAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [klaytnAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.MANTLESEP_V2_TESTNET]: {
            [mantleAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [mantleAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [mantleAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.OPTSEP_V2_TESTNET]: {
            [optAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [optAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [optAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
        [EndpointId.ODYSSEY_V2_TESTNET]: {
            [odysseyAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
            [odysseyAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
            [odysseyAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
        },
    } satisfies Partial<Record<EndpointId, MessagingAssetConfig>>
}

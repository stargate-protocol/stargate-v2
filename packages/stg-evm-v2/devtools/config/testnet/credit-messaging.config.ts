import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'
import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses } from '../../../ts-src/utils/util'
import { generateCreditMessagingConfig } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { onArb, onBsc, onEth, onKlaytn, onOpt } from './utils'

const contract = { contractName: 'CreditMessaging' }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    const ethCreditMsging = onEth(contract)
    const bscCreditMsging = onBsc(contract)
    const optCreditMsging = onOpt(contract)
    const arbCreditMsging = onArb(contract)
    const klaytnCreditMsging = onKlaytn(contract)

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
                contract: ethCreditMsging,
                config: {
                    planner: DEFAULT_PLANNER,
                    assets: {
                        [ethAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                        [ethAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [ethAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
                    },
                },
            },
            {
                contract: bscCreditMsging,
                config: {
                    planner: DEFAULT_PLANNER,
                    assets: {
                        [bscAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                    },
                },
            },
            {
                contract: optCreditMsging,
                config: {
                    planner: DEFAULT_PLANNER,
                    assets: {
                        [optAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                        [optAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [optAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
                    },
                },
            },
            {
                contract: arbCreditMsging,
                config: {
                    planner: DEFAULT_PLANNER,
                    assets: {
                        [arbAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                        [arbAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [arbAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
                    },
                },
            },
            {
                contract: klaytnCreditMsging,
                config: {
                    planner: DEFAULT_PLANNER,
                    assets: {
                        [klaytnAssetAddresses.USDT]: ASSETS[TokenName.USDT].assetId,
                        [klaytnAssetAddresses.USDC]: ASSETS[TokenName.USDC].assetId,
                        [klaytnAssetAddresses.ETH]: ASSETS[TokenName.ETH].assetId,
                    },
                },
            },
        ],
        connections: generateCreditMessagingConfig([
            ethCreditMsging,
            bscCreditMsging,
            optCreditMsging,
            arbCreditMsging,
            klaytnCreditMsging,
        ]),
    }
}

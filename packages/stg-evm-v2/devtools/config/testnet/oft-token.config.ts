import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { MintableNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { onKlaytn, onOdyssey } from './utils'
import { getTokenDeployName } from '../../../ops/util'
import { createGetAssetAddresses, getAssetType } from '../../../ts-src/utils/util'

export default async (): Promise<OmniGraphHardhat<MintableNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // Get the corresponding underlying OFTToken contract
    const klaytnETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.KLAYTN_V2_TESTNET, TokenName.ETH)
    )
    const klaytnETH = onKlaytn({ contractName: klaytnETHContractName })

    const odysseyETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.ODYSSEY_V2_TESTNET, TokenName.ETH)
    )
    const odysseyETH = onOdyssey({ contractName: odysseyETHContractName })

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const assets = [TokenName.ETH, TokenName.USDT] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_TESTNET, assets)
    const odysseyAssetAddresses = await getAssetAddresses(EndpointId.ODYSSEY_V2_TESTNET, assets)

    return {
        contracts: [
            {
                contract: klaytnETH,
                config: {
                    minters: {
                        [klaytnAssetAddresses.ETH]: true,
                        [klaytnAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: odysseyETH,
                config: {
                    minters: {
                        [odysseyAssetAddresses.ETH]: true,
                    },
                },
            },
        ],
        connections: [],
    }
}

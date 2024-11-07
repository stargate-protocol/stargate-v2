import { MintableNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

export default async (): Promise<OmniGraphHardhat<MintableNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    // const getEnvironment = createGetHreByEid()

    // Get the corresponding underlying OFTToken contract
    // const klaytnETHContractName = getTokenDeployName(
    //     TokenName.ETH,
    //     getAssetType(EndpointId.KLAYTN_V2_TESTNET, TokenName.ETH)
    // )
    // const klaytnETH = onKlaytn({ contractName: klaytnETHContractName })

    // const absETHContractName = getTokenDeployName(
    //     TokenName.ETH,
    //     getAssetType(EndpointId.ABSTRACT_V2_TESTNET, TokenName.ETH)
    // )
    // const absETH = onAbs({ contractName: absETHContractName })

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    // const assets = [TokenName.ETH /*, TokenName.USDT*/] as const
    // const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    // const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_TESTNET, assets)
    // const absAssetAddresses = await getAssetAddresses(EndpointId.ABSTRACT_V2_TESTNET, assets)

    return {
        contracts: [
            // {
            //     contract: klaytnETH,
            //     config: {
            //         minters: {
            //             // [klaytnAssetAddresses.ETH]: true,
            //             /*([klaytnAssetAddresses.USDT]: true,*/
            //         },
            //     },
            // },
            // {
            //     contract: absETH,
            //     config: {
            //         minters: {
            //             // [absAssetAddresses.ETH]: true,
            //             // [absAssetAddresses.USDT]: true,
            //         },
            //     },
            // },
        ],
        connections: [],
    }
}

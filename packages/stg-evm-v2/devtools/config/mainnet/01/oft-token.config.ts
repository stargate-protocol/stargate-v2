import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getTokenDeployName, getUSDTDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetType } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
import { onAvax, onEbi, onEth, onKlaytn, onRarible } from '../utils'

import type { MintableNodeConfig } from '../../../src/mintable'

export default async (): Promise<OmniGraphHardhat<MintableNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // USDT Deployment name is the same for all chains
    const usdtContractTemplate = { contractName: getUSDTDeployName() }

    // USDT contract pointers
    const ebiUSDT = onEbi(usdtContractTemplate)
    const klaytnUSDT = onKlaytn(usdtContractTemplate)
    const raribleUSDT = onRarible(usdtContractTemplate)

    const klaytnETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.KLAYTN_V2_MAINNET, TokenName.ETH)
    )
    const klaytnETH = onKlaytn({ contractName: klaytnETHContractName })

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const ebiAssetAddresses = await getAssetAddresses(EndpointId.EBI_V2_MAINNET, [TokenName.USDT] as const)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const raribleAssetAddresses = await getAssetAddresses(EndpointId.RARIBLE_V2_MAINNET, [TokenName.USDT] as const)

    // First we need to get the automatically created deployment names of our tokens
    const avaxXYZContractName = getTokenDeployName(
        TokenName.XYZ,
        getAssetType(EndpointId.AVALANCHE_V2_MAINNET, TokenName.XYZ)
    )
    const ethXYZContractName = getTokenDeployName(
        TokenName.XYZ,
        getAssetType(EndpointId.ETHEREUM_V2_MAINNET, TokenName.XYZ)
    )

    // We pass these in as contract names for devtools contract references
    const avaxXYZ = onAvax({ contractName: avaxXYZContractName })
    const ethXYZ = onEth({ contractName: ethXYZContractName })

    // Now we need to get the corresponsing asset addresses
    //
    // We need these so that they can be made minters of these tokens
    const avaxAssetAddresses = await getAssetAddresses(EndpointId.AVALANCHE_V2_MAINNET, [TokenName.XYZ] as const)
    const ethAssetAddresses = await getAssetAddresses(EndpointId.ETHEREUM_V2_MAINNET, [TokenName.XYZ] as const)

    return {
        contracts: [
            {
                contract: avaxXYZ,
                config: {
                    // We also use this configuration to specify the owner of the OFT contract (optional)
                    //
                    // This will be picked up by make transfer-mainnet
                    owner: getSafeAddress(EndpointId.AVALANCHE_V2_MAINNET),
                    minters: {
                        [avaxAssetAddresses.XYZ]: true,
                    },
                },
            },
            {
                contract: ethXYZ,
                config: {
                    // We also use this configuration to specify the owner of the OFT contract (optional)
                    //
                    // This will be picked up by make transfer-mainnet
                    owner: getSafeAddress(EndpointId.ETHEREUM_V2_MAINNET),
                    minters: {
                        [ethAssetAddresses.XYZ]: true,
                    },
                },
            },
            {
                contract: ebiUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.EBI_V2_MAINNET),
                    minters: {
                        [ebiAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: klaytnETH,
                config: {
                    owner: getSafeAddress(EndpointId.KLAYTN_V2_MAINNET),
                    minters: {
                        [klaytnAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: klaytnUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.KLAYTN_V2_MAINNET),
                    minters: {
                        [klaytnAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: raribleUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.RARIBLE_V2_MAINNET),
                    minters: {
                        [raribleAssetAddresses.USDT]: true,
                    },
                },
            },
        ],
        connections: [],
    }
}

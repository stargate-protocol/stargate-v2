import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getTokenDeployName, getUSDTDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetType } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
import { onEbi, onKlaytn, onRarible } from '../utils'

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

    return {
        contracts: [
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

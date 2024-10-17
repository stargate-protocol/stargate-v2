import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { MintableNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getTokenDeployName, getUSDTDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetType } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
import { onDegen, onEbi, onFlare, onGravity, onIota, onKlaytn, onRarible, onSei, onTaiko } from '../utils'

export default async (): Promise<OmniGraphHardhat<MintableNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // USDT Deployment name is the same for all chains
    const usdtContractTemplate = { contractName: getUSDTDeployName() }

    // USDT contract pointers
    const degenUSDT = onDegen(usdtContractTemplate)
    const ebiUSDT = onEbi(usdtContractTemplate)
    const flareUSDT = onFlare(usdtContractTemplate)
    const gravityUSDT = onGravity(usdtContractTemplate)
    const iotaUSDT = onIota(usdtContractTemplate)
    const klaytnUSDT = onKlaytn(usdtContractTemplate)
    const raribleUSDT = onRarible(usdtContractTemplate)
    const taikoUSDT = onTaiko(usdtContractTemplate)

    // ETH contract pointers
    const degenETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.DEGEN_V2_MAINNET, TokenName.ETH)
    )
    const degenETH = onDegen({ contractName: degenETHContractName })

    const flareETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.FLARE_V2_MAINNET, TokenName.ETH)
    )
    const flareETH = onFlare({ contractName: flareETHContractName })

    const gravityETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.GRAVITY_V2_MAINNET, TokenName.ETH)
    )
    const gravityETH = onGravity({ contractName: gravityETHContractName })
    const iotaETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.IOTA_V2_MAINNET, TokenName.ETH)
    )
    const iotaETH = onIota({ contractName: iotaETHContractName })

    const klaytnETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.KLAYTN_V2_MAINNET, TokenName.ETH)
    )
    const klaytnETH = onKlaytn({ contractName: klaytnETHContractName })

    const seiETHContractName = getTokenDeployName(TokenName.ETH, getAssetType(EndpointId.SEI_V2_MAINNET, TokenName.ETH))
    const seiETH = onSei({ contractName: seiETHContractName })

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const degenAssetAddresses = await getAssetAddresses(EndpointId.DEGEN_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const ebiAssetAddresses = await getAssetAddresses(EndpointId.EBI_V2_MAINNET, [TokenName.USDT] as const)
    const flareAssetAddresses = await getAssetAddresses(EndpointId.FLARE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const gravityAssetAddresses = await getAssetAddresses(EndpointId.GRAVITY_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const iotaAssetAddresses = await getAssetAddresses(EndpointId.IOTA_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const raribleAssetAddresses = await getAssetAddresses(EndpointId.RARIBLE_V2_MAINNET, [TokenName.USDT] as const)
    const seiAssetAddresses = await getAssetAddresses(EndpointId.SEI_V2_MAINNET, [TokenName.ETH] as const)
    const taikoAssetAddresses = await getAssetAddresses(EndpointId.TAIKO_V2_MAINNET, [TokenName.USDT] as const)

    return {
        contracts: [
            {
                contract: degenETH,
                config: {
                    owner: getSafeAddress(EndpointId.DEGEN_V2_MAINNET),
                    minters: {
                        [degenAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: degenUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.DEGEN_V2_MAINNET),
                    minters: {
                        [degenAssetAddresses.USDT]: true,
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
                contract: flareETH,
                config: {
                    owner: getSafeAddress(EndpointId.FLARE_V2_MAINNET),
                    minters: {
                        [flareAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: flareUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.FLARE_V2_MAINNET),
                    minters: {
                        [flareAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: gravityETH,
                config: {
                    owner: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                    minters: {
                        [gravityAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: gravityUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.GRAVITY_V2_MAINNET),
                    minters: {
                        [gravityAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: iotaETH,
                config: {
                    owner: getSafeAddress(EndpointId.IOTA_V2_MAINNET),
                    minters: {
                        [iotaAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: iotaUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.IOTA_V2_MAINNET),
                    minters: {
                        [iotaAssetAddresses.USDT]: true,
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
            {
                contract: seiETH,
                config: {
                    owner: getSafeAddress(EndpointId.SEI_V2_MAINNET),
                    minters: {
                        [seiAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: taikoUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.TAIKO_V2_MAINNET),
                    minters: {
                        [taikoAssetAddresses.USDT]: true,
                    },
                },
            },
        ],
        connections: [],
    }
}

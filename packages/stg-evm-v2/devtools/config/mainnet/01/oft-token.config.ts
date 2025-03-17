import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { MintableNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getTokenDeployName, getUSDTDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetType } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
import {
    onApe,
    onBera,
    onCronosevm,
    onDegen,
    onFlare,
    onFlow,
    onFuse,
    onGlue,
    onGoat,
    onGravity,
    onIota,
    onIslander,
    onKlaytn,
    onLightlink,
    onPeaq,
    onRarible,
    onRootstock,
    onSei,
    onStory,
    onTaiko,
    onTelos,
} from '../utils'

// Both USDC and USDT now (as of 2024-12-10) have their own config files, so this file is just used for WETH Hydra deployents

export default async (): Promise<OmniGraphHardhat<MintableNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()

    // USDT Deployment name is the same for all chains
    const usdtContractTemplate = { contractName: getUSDTDeployName() }

    // USDT contract pointers (for old method of deployment)
    const flareUSDT = onFlare(usdtContractTemplate)
    const gravityUSDT = onGravity(usdtContractTemplate)
    const iotaUSDT = onIota(usdtContractTemplate)
    const klaytnUSDT = onKlaytn(usdtContractTemplate)
    const lightlinkUSDT = onLightlink(usdtContractTemplate)
    const raribleUSDT = onRarible(usdtContractTemplate)
    const taikoUSDT = onTaiko(usdtContractTemplate)

    // ETH contract pointers (for all WETH OFT)
    const apeETHContractName = getTokenDeployName(TokenName.ETH, getAssetType(EndpointId.APE_V2_MAINNET, TokenName.ETH))
    const apeETH = onApe({ contractName: apeETHContractName })
    const beraETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.BERA_V2_MAINNET, TokenName.ETH)
    )
    const beraETH = onBera({ contractName: beraETHContractName })
    const cronosevmETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.CRONOSEVM_V2_MAINNET, TokenName.ETH)
    )
    const cronosevmETH = onCronosevm({ contractName: cronosevmETHContractName })
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

    const flowETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.FLOW_V2_MAINNET, TokenName.ETH)
    )
    const flowETH = onFlow({ contractName: flowETHContractName })

    const fuseETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.FUSE_V2_MAINNET, TokenName.ETH)
    )
    const fuseETH = onFuse({ contractName: fuseETHContractName })

    const glueETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.GLUE_V2_MAINNET, TokenName.ETH)
    )
    const glueETH = onGlue({ contractName: glueETHContractName })

    const goatETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.GOAT_V2_MAINNET, TokenName.ETH)
    )
    const goatETH = onGoat({ contractName: goatETHContractName })

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

    const islanderETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.ISLANDER_V2_MAINNET, TokenName.ETH)
    )
    const islanderETH = onIslander({ contractName: islanderETHContractName })

    const klaytnETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.KLAYTN_V2_MAINNET, TokenName.ETH)
    )
    const klaytnETH = onKlaytn({ contractName: klaytnETHContractName })

    const peaqETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.PEAQ_V2_MAINNET, TokenName.ETH)
    )
    const peaqETH = onPeaq({ contractName: peaqETHContractName })

    const rootstockETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.ROOTSTOCK_V2_MAINNET, TokenName.ETH)
    )
    const rootstockETH = onRootstock({ contractName: rootstockETHContractName })

    const seiETHContractName = getTokenDeployName(TokenName.ETH, getAssetType(EndpointId.SEI_V2_MAINNET, TokenName.ETH))
    const seiETH = onSei({ contractName: seiETHContractName })

    const storyETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.STORY_V2_MAINNET, TokenName.ETH)
    )
    const storyETH = onStory({ contractName: storyETHContractName })

    const telosETHContractName = getTokenDeployName(
        TokenName.ETH,
        getAssetType(EndpointId.TELOS_V2_MAINNET, TokenName.ETH)
    )
    const telosETH = onTelos({ contractName: telosETHContractName })

    // Now we collect the address of the deployed WETH assets(StargateOft.sol etc.)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const apeAssetAddresses = await getAssetAddresses(EndpointId.APE_V2_MAINNET, [TokenName.ETH] as const)
    const beraAssetAddresses = await getAssetAddresses(EndpointId.BERA_V2_MAINNET, [TokenName.ETH] as const)
    const cronosevmAssetAddresses = await getAssetAddresses(EndpointId.CRONOSEVM_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDC,
    ] as const)
    const degenAssetAddresses = await getAssetAddresses(EndpointId.DEGEN_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const flareAssetAddresses = await getAssetAddresses(EndpointId.FLARE_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const flowAssetAddresses = await getAssetAddresses(EndpointId.FLOW_V2_MAINNET, [TokenName.ETH] as const)
    const fuseAssetAddresses = await getAssetAddresses(EndpointId.FUSE_V2_MAINNET, [TokenName.ETH] as const)
    const glueAssetAddresses = await getAssetAddresses(EndpointId.GLUE_V2_MAINNET, [TokenName.ETH] as const)
    const goatAssetAddresses = await getAssetAddresses(EndpointId.GOAT_V2_MAINNET, [TokenName.ETH] as const)
    const gravityAssetAddresses = await getAssetAddresses(EndpointId.GRAVITY_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const iotaAssetAddresses = await getAssetAddresses(EndpointId.IOTA_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const islanderAssetAddresses = await getAssetAddresses(EndpointId.ISLANDER_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const lightlinkAssetAddresses = await getAssetAddresses(EndpointId.LIGHTLINK_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const peaqAssetAddresses = await getAssetAddresses(EndpointId.PEAQ_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const raribleAssetAddresses = await getAssetAddresses(EndpointId.RARIBLE_V2_MAINNET, [TokenName.USDT] as const)
    const rootstockAssetAddresses = await getAssetAddresses(EndpointId.ROOTSTOCK_V2_MAINNET, [
        TokenName.ETH,
        TokenName.USDT,
    ] as const)
    const seiAssetAddresses = await getAssetAddresses(EndpointId.SEI_V2_MAINNET, [TokenName.ETH] as const)
    const storyAssetAddresses = await getAssetAddresses(EndpointId.STORY_V2_MAINNET, [TokenName.ETH] as const)
    const taikoAssetAddresses = await getAssetAddresses(EndpointId.TAIKO_V2_MAINNET, [TokenName.USDT] as const)
    const telosAssetAddresses = await getAssetAddresses(EndpointId.TELOS_V2_MAINNET, [TokenName.ETH] as const)

    return {
        contracts: [
            {
                contract: apeETH,
                config: {
                    owner: getSafeAddress(EndpointId.APE_V2_MAINNET),
                    minters: {
                        [apeAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: beraETH,
                config: {
                    owner: getSafeAddress(EndpointId.BERA_V2_MAINNET),
                    minters: {
                        [beraAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: cronosevmETH,
                config: {
                    owner: getSafeAddress(EndpointId.CRONOSEVM_V2_MAINNET),
                    minters: {
                        [cronosevmAssetAddresses.ETH]: true,
                        [cronosevmAssetAddresses.USDC]: true,
                    },
                },
            },
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
                contract: flowETH,
                config: {
                    owner: getSafeAddress(EndpointId.FLOW_V2_MAINNET),
                    minters: {
                        [flowAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: fuseETH,
                config: {
                    owner: getSafeAddress(EndpointId.FUSE_V2_MAINNET),
                    minters: {
                        [fuseAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: glueETH,
                config: {
                    owner: getSafeAddress(EndpointId.GLUE_V2_MAINNET),
                    minters: {
                        [glueAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: goatETH,
                config: {
                    owner: getSafeAddress(EndpointId.GOAT_V2_MAINNET),
                    minters: {
                        [goatAssetAddresses.ETH]: true,
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
                contract: islanderETH,
                config: {
                    owner: getSafeAddress(EndpointId.ISLANDER_V2_MAINNET),
                    minters: {
                        [islanderAssetAddresses.ETH]: true,
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
                contract: lightlinkUSDT,
                config: {
                    owner: getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET),
                    minters: {
                        [lightlinkAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: peaqETH,
                config: {
                    owner: getSafeAddress(EndpointId.PEAQ_V2_MAINNET),
                    minters: {
                        [peaqAssetAddresses.ETH]: true,
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
                contract: rootstockETH,
                config: {
                    owner: getSafeAddress(EndpointId.ROOTSTOCK_V2_MAINNET),
                    minters: {
                        [rootstockAssetAddresses.ETH]: true,
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
                contract: storyETH,
                config: {
                    owner: getSafeAddress(EndpointId.STORY_V2_MAINNET),
                    minters: {
                        [storyAssetAddresses.ETH]: true,
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
            {
                contract: telosETH,
                config: {
                    owner: getSafeAddress(EndpointId.TELOS_V2_MAINNET),
                    minters: {
                        [telosAssetAddresses.ETH]: true,
                    },
                },
            },
        ],
        connections: [],
    }
}

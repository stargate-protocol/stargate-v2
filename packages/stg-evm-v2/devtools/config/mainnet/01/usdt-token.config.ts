import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import {
    onAbstract,
    onApe,
    onDegen,
    onFlow,
    onFuse,
    onGlue,
    onGoat,
    onHemi,
    onIslander,
    onPeaq,
    onPlume,
    onPlumephoenix,
    onRootstock,
    onStory,
    onTelos,
    onXdc,
} from '../utils'

const fiatContract = { contractName: 'TetherTokenV2' }

// For external USDT deployments
const usdtPeaqAsset = getAssetNetworkConfig(EndpointId.PEAQ_V2_MAINNET, TokenName.USDT)
assert(usdtPeaqAsset.address != null, `External USDT address not found for PEAQ`)

const usdtAbstractAsset = getAssetNetworkConfig(EndpointId.ABSTRACT_V2_MAINNET, TokenName.USDT)
assert(usdtAbstractAsset.address != null, `External USDT address not found for ABSTRACT`)

const usdtApeAsset = getAssetNetworkConfig(EndpointId.APE_V2_MAINNET, TokenName.USDT)
assert(usdtApeAsset.address != null, `External USDT address not found for APE`)

const usdtDegenAsset = getAssetNetworkConfig(EndpointId.DEGEN_V2_MAINNET, TokenName.USDT)
assert(usdtDegenAsset.address != null, `External USDT address not found for DEGEN`)

const usdtFlowAsset = getAssetNetworkConfig(EndpointId.FLOW_V2_MAINNET, TokenName.USDT)
assert(usdtFlowAsset.address != null, `External USDT address not found for FLOW`)

const usdtFuseAsset = getAssetNetworkConfig(EndpointId.FUSE_V2_MAINNET, TokenName.USDT)
assert(usdtFuseAsset.address != null, `External USDT address not found for FUSE`)

const usdtGlueAsset = getAssetNetworkConfig(EndpointId.GLUE_V2_MAINNET, TokenName.USDT)
assert(usdtGlueAsset.address != null, `External USDT address not found for GLUE`)

const usdtGoatAsset = getAssetNetworkConfig(EndpointId.GOAT_V2_MAINNET, TokenName.USDT)
assert(usdtGoatAsset.address != null, `External USDT address not found for GOAT`)

const usdtHemiAsset = getAssetNetworkConfig(EndpointId.HEMI_V2_MAINNET, TokenName.USDT)
assert(usdtHemiAsset.address != null, `External USDT address not found for HEMI`)

const usdtIslanderAsset = getAssetNetworkConfig(EndpointId.ISLANDER_V2_MAINNET, TokenName.USDT)
assert(usdtIslanderAsset.address != null, `External USDT address not found for ISLANDER`)

const usdtPlumeAsset = getAssetNetworkConfig(EndpointId.PLUME_V2_MAINNET, TokenName.USDT)
assert(usdtPlumeAsset.address != null, `External USDT address not found for PLUME`)

const usdtPlumephoenixAsset = getAssetNetworkConfig(EndpointId.PLUMEPHOENIX_V2_MAINNET, TokenName.USDT)
assert(usdtPlumephoenixAsset.address != null, `External USDT address not found for PLUMEPHOENIX`)

const usdtRootstockAsset = getAssetNetworkConfig(EndpointId.ROOTSTOCK_V2_MAINNET, TokenName.USDT)
assert(usdtRootstockAsset.address != null, `External USDT address not found for ROOTSTOCK`)

const usdtStoryAsset = getAssetNetworkConfig(EndpointId.STORY_V2_MAINNET, TokenName.USDT)
assert(usdtStoryAsset.address != null, `External USDT address not found for STORY`)

const usdtTelosAsset = getAssetNetworkConfig(EndpointId.TELOS_V2_MAINNET, TokenName.USDT)
assert(usdtTelosAsset.address != null, `External USDT address not found for TELOS`)

const usdtXdcAsset = getAssetNetworkConfig(EndpointId.XDC_V2_MAINNET, TokenName.USDT)
assert(usdtXdcAsset.address != null, `External USDT address not found for XDC`)

export default async (): Promise<OmniGraphHardhat<OwnableNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const peaqUSDTProxy = await contractFactory(
        onPeaq({ contractName: 'TransparentUpgradeableProxy', address: usdtPeaqAsset.address })
    )

    const abstractUSDTProxy = await contractFactory(
        onAbstract({ contractName: 'TransparentUpgradeableProxy', address: usdtAbstractAsset.address })
    )

    const apeUSDTProxy = await contractFactory(
        onApe({ contractName: 'TransparentUpgradeableProxy', address: usdtApeAsset.address })
    )

    const degenUSDTProxy = await contractFactory(
        onDegen({ contractName: 'TransparentUpgradeableProxy', address: usdtDegenAsset.address })
    )

    const flowUSDTProxy = await contractFactory(
        onFlow({ contractName: 'TransparentUpgradeableProxy', address: usdtFlowAsset.address })
    )

    const fuseUSDTProxy = await contractFactory(
        onFuse({ contractName: 'TransparentUpgradeableProxy', address: usdtFuseAsset.address })
    )

    const glueUSDTProxy = await contractFactory(
        onGlue({ contractName: 'TransparentUpgradeableProxy', address: usdtGlueAsset.address })
    )

    const goatUSDTProxy = await contractFactory(
        onGoat({ contractName: 'TransparentUpgradeableProxy', address: usdtGoatAsset.address })
    )

    const hemiUSDTProxy = await contractFactory(
        onHemi({ contractName: 'TransparentUpgradeableProxy', address: usdtHemiAsset.address })
    )

    const islanderUSDTProxy = await contractFactory(
        onIslander({ contractName: 'TransparentUpgradeableProxy', address: usdtIslanderAsset.address })
    )

    const plumeUSDTProxy = await contractFactory(
        onPlume({ contractName: 'TransparentUpgradeableProxy', address: usdtPlumeAsset.address })
    )

    const plumephoenixUSDTProxy = await contractFactory(
        onPlumephoenix({ contractName: 'TransparentUpgradeableProxy', address: usdtPlumephoenixAsset.address })
    )

    const rootstockUSDTProxy = await contractFactory(
        onRootstock({ contractName: 'TransparentUpgradeableProxy', address: usdtRootstockAsset.address })
    )

    const storyUSDTProxy = await contractFactory(
        onStory({ contractName: 'TransparentUpgradeableProxy', address: usdtStoryAsset.address })
    )

    const telosUSDTProxy = await contractFactory(
        onTelos({ contractName: 'TransparentUpgradeableProxy', address: usdtTelosAsset.address })
    )

    const xdcUSDTProxy = await contractFactory(
        onXdc({
            contractName: 'TransparentUpgradeableProxy',
            address: usdtXdcAsset.address,
        })
    )

    const peaqUSDT = onPeaq({ ...fiatContract, address: peaqUSDTProxy.contract.address })
    const abstractUSDT = onAbstract({ ...fiatContract, address: abstractUSDTProxy.contract.address })
    const apeUSDT = onApe({ ...fiatContract, address: apeUSDTProxy.contract.address })
    const degenUSDT = onDegen({ ...fiatContract, address: degenUSDTProxy.contract.address })
    const flowUSDT = onFlow({ ...fiatContract, address: flowUSDTProxy.contract.address })
    const fuseUSDT = onFuse({ ...fiatContract, address: fuseUSDTProxy.contract.address })
    const glueUSDT = onGlue({ ...fiatContract, address: glueUSDTProxy.contract.address })
    const goatUSDT = onGoat({ ...fiatContract, address: goatUSDTProxy.contract.address })
    const hemiUSDT = onHemi({ ...fiatContract, address: hemiUSDTProxy.contract.address })
    const islanderUSDT = onIslander({ ...fiatContract, address: islanderUSDTProxy.contract.address })
    const plumeUSDT = onPlume({ ...fiatContract, address: plumeUSDTProxy.contract.address })
    const plumephoenixUSDT = onPlumephoenix({ ...fiatContract, address: plumephoenixUSDTProxy.contract.address })
    const rootstockUSDT = onRootstock({ ...fiatContract, address: rootstockUSDTProxy.contract.address })
    const storyUSDT = onStory({ ...fiatContract, address: storyUSDTProxy.contract.address })
    const telosUSDT = onTelos({ ...fiatContract, address: telosUSDTProxy.contract.address })
    const xdcUSDT = onXdc({ ...fiatContract, address: xdcUSDTProxy.contract.address })
    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const usdtAssets = [TokenName.USDT] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const peaqAssetAddresses = await getAssetAddresses(EndpointId.PEAQ_V2_MAINNET, usdtAssets)
    const abstractAssetAddresses = await getAssetAddresses(EndpointId.ABSTRACT_V2_MAINNET, usdtAssets)
    const apeAssetAddresses = await getAssetAddresses(EndpointId.APE_V2_MAINNET, usdtAssets)
    const degenAssetAddresses = await getAssetAddresses(EndpointId.DEGEN_V2_MAINNET, usdtAssets)
    const flowAssetAddresses = await getAssetAddresses(EndpointId.FLOW_V2_MAINNET, usdtAssets)
    const fuseAssetAddresses = await getAssetAddresses(EndpointId.FUSE_V2_MAINNET, usdtAssets)
    const glueAssetAddresses = await getAssetAddresses(EndpointId.GLUE_V2_MAINNET, usdtAssets)
    const goatAssetAddresses = await getAssetAddresses(EndpointId.GOAT_V2_MAINNET, usdtAssets)
    const hemiAssetAddresses = await getAssetAddresses(EndpointId.HEMI_V2_MAINNET, usdtAssets)
    const islanderAssetAddresses = await getAssetAddresses(EndpointId.ISLANDER_V2_MAINNET, usdtAssets)
    const plumeAssetAddresses = await getAssetAddresses(EndpointId.PLUME_V2_MAINNET, usdtAssets)
    const plumephoenixAssetAddresses = await getAssetAddresses(EndpointId.PLUMEPHOENIX_V2_MAINNET, usdtAssets)
    const rootstockAssetAddresses = await getAssetAddresses(EndpointId.ROOTSTOCK_V2_MAINNET, usdtAssets)
    const storyAssetAddresses = await getAssetAddresses(EndpointId.STORY_V2_MAINNET, usdtAssets)
    const telosAssetAddresses = await getAssetAddresses(EndpointId.TELOS_V2_MAINNET, usdtAssets)
    const xdcAssetAddresses = await getAssetAddresses(EndpointId.XDC_V2_MAINNET, usdtAssets)

    return {
        contracts: [
            {
                contract: peaqUSDT,
                config: {
                    owner: peaqAssetAddresses.USDT,
                },
            },
            {
                contract: abstractUSDT,
                config: {
                    owner: abstractAssetAddresses.USDT,
                },
            },
            {
                contract: apeUSDT,
                config: {
                    owner: apeAssetAddresses.USDT,
                },
            },
            {
                contract: degenUSDT,
                config: {
                    owner: degenAssetAddresses.USDT,
                },
            },
            {
                contract: flowUSDT,
                config: {
                    owner: flowAssetAddresses.USDT,
                },
            },
            {
                contract: fuseUSDT,
                config: {
                    owner: fuseAssetAddresses.USDT,
                },
            },
            {
                contract: glueUSDT,
                config: {
                    owner: glueAssetAddresses.USDT,
                },
            },
            {
                contract: goatUSDT,
                config: {
                    owner: goatAssetAddresses.USDT,
                },
            },
            {
                contract: hemiUSDT,
                config: {
                    owner: hemiAssetAddresses.USDT,
                },
            },
            {
                contract: islanderUSDT,
                config: {
                    owner: islanderAssetAddresses.USDT,
                },
            },
            {
                contract: plumeUSDT,
                config: {
                    owner: plumeAssetAddresses.USDT,
                },
            },
            {
                contract: plumephoenixUSDT,
                config: {
                    owner: plumephoenixAssetAddresses.USDT,
                },
            },
            {
                contract: rootstockUSDT,
                config: {
                    owner: rootstockAssetAddresses.USDT,
                },
            },
            {
                contract: storyUSDT,
                config: {
                    owner: storyAssetAddresses.USDT,
                },
            },
            {
                contract: telosUSDT,
                config: {
                    owner: telosAssetAddresses.USDT,
                },
            },
            {
                contract: xdcUSDT,
                config: {
                    owner: xdcAssetAddresses.USDT,
                },
            },
        ],
        connections: [],
    }
}

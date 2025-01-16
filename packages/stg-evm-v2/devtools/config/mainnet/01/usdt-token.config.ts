import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import { onAbstract, onDegen, onFuse, onHemi, onIslander, onPeaq, onPlume, onRootstock } from '../utils'

const fiatContract = { contractName: 'TetherTokenV2' }

// For external USDT deployments
const usdtPeaqAsset = getAssetNetworkConfig(EndpointId.PEAQ_V2_MAINNET, TokenName.USDT)
assert(usdtPeaqAsset.address != null, `External USDT address not found for PEAQ`)

const usdtAbstractAsset = getAssetNetworkConfig(EndpointId.ABSTRACT_V2_MAINNET, TokenName.USDT)
assert(usdtAbstractAsset.address != null, `External USDT address not found for ABSTRACT`)

const usdtDegenAsset = getAssetNetworkConfig(EndpointId.DEGEN_V2_MAINNET, TokenName.USDT)
assert(usdtDegenAsset.address != null, `External USDT address not found for DEGEN`)

const usdtFuseAsset = getAssetNetworkConfig(EndpointId.FUSE_V2_MAINNET, TokenName.USDT)
assert(usdtFuseAsset.address != null, `External USDT address not found for FUSE`)

const usdtHemiAsset = getAssetNetworkConfig(EndpointId.HEMI_V2_MAINNET, TokenName.USDT)
assert(usdtHemiAsset.address != null, `External USDT address not found for HEMI`)

const usdtIslanderAsset = getAssetNetworkConfig(EndpointId.ISLANDER_V2_MAINNET, TokenName.USDT)
assert(usdtIslanderAsset.address != null, `External USDT address not found for ISLANDER`)

const usdtPlumeAsset = getAssetNetworkConfig(EndpointId.PLUME_V2_MAINNET, TokenName.USDT)
assert(usdtPlumeAsset.address != null, `External USDT address not found for PLUME`)

const usdtRootstockAsset = getAssetNetworkConfig(EndpointId.ROOTSTOCK_V2_MAINNET, TokenName.USDT)
assert(usdtRootstockAsset.address != null, `External USDT address not found for ROOTSTOCK`)

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

    const degenUSDTProxy = await contractFactory(
        onDegen({ contractName: 'TransparentUpgradeableProxy', address: usdtDegenAsset.address })
    )

    const fuseUSDTProxy = await contractFactory(
        onFuse({ contractName: 'TransparentUpgradeableProxy', address: usdtFuseAsset.address })
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

    const rootstockUSDTProxy = await contractFactory(
        onRootstock({ contractName: 'TransparentUpgradeableProxy', address: usdtRootstockAsset.address })
    )

    const peaqUSDT = onPeaq({ ...fiatContract, address: peaqUSDTProxy.contract.address })
    const abstractUSDT = onAbstract({ ...fiatContract, address: abstractUSDTProxy.contract.address })
    const degenUSDT = onDegen({ ...fiatContract, address: degenUSDTProxy.contract.address })
    const fuseUSDT = onFuse({ ...fiatContract, address: fuseUSDTProxy.contract.address })
    const hemiUSDT = onHemi({ ...fiatContract, address: hemiUSDTProxy.contract.address })
    const islanderUSDT = onIslander({ ...fiatContract, address: islanderUSDTProxy.contract.address })
    const plumeUSDT = onPlume({ ...fiatContract, address: plumeUSDTProxy.contract.address })
    const rootstockUSDT = onRootstock({ ...fiatContract, address: rootstockUSDTProxy.contract.address })

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const usdtAssets = [TokenName.USDT] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const peaqAssetAddresses = await getAssetAddresses(EndpointId.PEAQ_V2_MAINNET, usdtAssets)
    const abstractAssetAddresses = await getAssetAddresses(EndpointId.ABSTRACT_V2_MAINNET, usdtAssets)
    const degenAssetAddresses = await getAssetAddresses(EndpointId.DEGEN_V2_MAINNET, usdtAssets)
    const fuseAssetAddresses = await getAssetAddresses(EndpointId.FUSE_V2_MAINNET, usdtAssets)
    const hemiAssetAddresses = await getAssetAddresses(EndpointId.HEMI_V2_MAINNET, usdtAssets)
    const islanderAssetAddresses = await getAssetAddresses(EndpointId.ISLANDER_V2_MAINNET, usdtAssets)
    const plumeAssetAddresses = await getAssetAddresses(EndpointId.PLUME_V2_MAINNET, usdtAssets)
    const rootstockAssetAddresses = await getAssetAddresses(EndpointId.ROOTSTOCK_V2_MAINNET, usdtAssets)

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
                contract: degenUSDT,
                config: {
                    owner: degenAssetAddresses.USDT,
                },
            },
            {
                contract: fuseUSDT,
                config: {
                    owner: fuseAssetAddresses.USDT,
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
                contract: rootstockUSDT,
                config: {
                    owner: rootstockAssetAddresses.USDT,
                },
            },
        ],
        connections: [],
    }
}

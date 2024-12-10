import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
import {
    onCodex,
    onDegen,
    onFlare,
    onFuse,
    onGravity,
    onIota,
    onIslander,
    onKlaytn,
    onLightlink,
    onPeaq,
    onPlume,
    onRarible,
    onSuperposition,
    onTaiko,
    onXchain,
} from '../utils'

const proxyContract = { contractName: getUSDCProxyDeployName() }
const fiatContract = { contractName: 'FiatTokenV2_2' }

// Except for chains where it's deployed externally
const usdcPeaqAsset = getAssetNetworkConfig(EndpointId.PEAQ_V2_MAINNET, TokenName.USDC)
assert(usdcPeaqAsset.address != null, `External USDC address not found for PEAQ`)

const usdcCodexAsset = getAssetNetworkConfig(EndpointId.CODEX_V2_MAINNET, TokenName.USDC)
assert(usdcCodexAsset.address != null, `External USDC address not found for CODEX`)

const usdcDegenAsset = getAssetNetworkConfig(EndpointId.DEGEN_V2_MAINNET, TokenName.USDC)
assert(usdcDegenAsset.address != null, `External USDC address not found for DEGEN`)

const usdcFuseAsset = getAssetNetworkConfig(EndpointId.FUSE_V2_MAINNET, TokenName.USDC)
assert(usdcFuseAsset.address != null, `External USDC address not found for FUSE`)

const usdcIslanderAsset = getAssetNetworkConfig(EndpointId.ISLANDER_V2_MAINNET, TokenName.USDC)
assert(usdcIslanderAsset.address != null, `External USDC address not found for ISLANDER`)

const usdcPlumeAsset = getAssetNetworkConfig(EndpointId.PLUME_V2_MAINNET, TokenName.USDC)
assert(usdcPlumeAsset.address != null, `External USDC address not found for PLUME`)

const usdcSuperpositionAsset = getAssetNetworkConfig(EndpointId.SUPERPOSITION_V2_MAINNET, TokenName.USDC)
assert(usdcSuperpositionAsset.address != null, `External USDC address not found for SUPERPOSITION`)

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const codexUSDCProxy = await contractFactory(
        onCodex({ contractName: 'FiatTokenProxy', address: usdcCodexAsset.address })
    )
    const degenUSDCProxy = await contractFactory(
        onDegen({ contractName: 'FiatTokenProxy', address: usdcDegenAsset.address })
    )
    const flareUSDCProxy = await contractFactory(onFlare(proxyContract))
    const fuseUSDCProxy = await contractFactory(
        onFuse({ contractName: 'FiatTokenProxy', address: usdcFuseAsset.address })
    )
    const gravityUSDCProxy = await contractFactory(onGravity(proxyContract))
    const iotaUSDCProxy = await contractFactory(onIota(proxyContract))
    const islanderUSDCProxy = await contractFactory(
        onIslander({ contractName: 'FiatTokenProxy', address: usdcIslanderAsset.address })
    )
    const klaytnUSDCProxy = await contractFactory(onKlaytn(proxyContract))
    const lightlinkUSDCProxy = await contractFactory(onLightlink(proxyContract))
    const peaqUSDCProxy = await contractFactory(
        onPeaq({ contractName: 'FiatTokenProxy', address: usdcPeaqAsset.address })
    )
    const plumeUSDCProxy = await contractFactory(
        onPlume({ contractName: 'FiatTokenProxy', address: usdcPlumeAsset.address })
    )
    const raribleUSDCProxy = await contractFactory(onRarible(proxyContract))
    const superpositionUSDCProxy = await contractFactory(
        onSuperposition({ contractName: 'FiatTokenProxy', address: usdcSuperpositionAsset.address })
    )
    const taikoUSDCProxy = await contractFactory(onTaiko(proxyContract))
    const xchainUSDCProxy = await contractFactory(onXchain(proxyContract))

    // Get the corresponding underlying USDC contract
    const codexUSDC = onCodex({ ...fiatContract, address: codexUSDCProxy.contract.address })
    const codexStargateMultisig = getSafeAddress(EndpointId.CODEX_V2_MAINNET)

    const degenUSDC = onDegen({ ...fiatContract, address: degenUSDCProxy.contract.address })
    const degenStargateMultisig = getSafeAddress(EndpointId.DEGEN_V2_MAINNET)

    const flareUSDC = onFlare({ ...fiatContract, address: flareUSDCProxy.contract.address })
    const flareStargateMultisig = getSafeAddress(EndpointId.FLARE_V2_MAINNET)

    const fuseUSDC = onFuse({ ...fiatContract, address: fuseUSDCProxy.contract.address })
    const fuseStargateMultisig = getSafeAddress(EndpointId.FUSE_V2_MAINNET)

    const gravityUSDC = onGravity({ ...fiatContract, address: gravityUSDCProxy.contract.address })
    const gravityStargateMultisig = getSafeAddress(EndpointId.GRAVITY_V2_MAINNET)

    const iotaUSDC = onIota({ ...fiatContract, address: iotaUSDCProxy.contract.address })
    const iotaStargateMultisig = getSafeAddress(EndpointId.IOTA_V2_MAINNET)

    const islanderUSDC = onIslander({ ...fiatContract, address: islanderUSDCProxy.contract.address })
    const islanderStargateMultisig = getSafeAddress(EndpointId.ISLANDER_V2_MAINNET)

    const klaytnUSDC = onKlaytn({ ...fiatContract, address: klaytnUSDCProxy.contract.address })
    const klaytnStargateMultisig = getSafeAddress(EndpointId.KLAYTN_V2_MAINNET)

    const lightlinkUSDC = onLightlink({ ...fiatContract, address: lightlinkUSDCProxy.contract.address })
    const lightlinkStargateMultisig = getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET)

    const peaqUSDC = onPeaq({ ...fiatContract, address: peaqUSDCProxy.contract.address })
    const peaqStargateMultisig = getSafeAddress(EndpointId.PEAQ_V2_MAINNET)

    const plumeUSDC = onPlume({ ...fiatContract, address: plumeUSDCProxy.contract.address })
    const plumeStargateMultisig = getSafeAddress(EndpointId.PLUME_V2_MAINNET)

    const raribleUSDC = onRarible({ ...fiatContract, address: raribleUSDCProxy.contract.address })
    const raribleStargateMultisig = getSafeAddress(EndpointId.RARIBLE_V2_MAINNET)

    const superpositionUSDC = onSuperposition({ ...fiatContract, address: superpositionUSDCProxy.contract.address })
    const superpositionStargateMultisig = getSafeAddress(EndpointId.SUPERPOSITION_V2_MAINNET)

    const taikoUSDC = onTaiko({ ...fiatContract, address: taikoUSDCProxy.contract.address })
    const taikoStargateMultisig = getSafeAddress(EndpointId.TAIKO_V2_MAINNET)

    const xchainUSDC = onXchain({ ...fiatContract, address: xchainUSDCProxy.contract.address })
    const xchainStargateMultisig = getSafeAddress(EndpointId.XCHAIN_V2_MAINNET)

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const usdcAssets = [TokenName.USDC] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const codexAssetAddresses = await getAssetAddresses(EndpointId.CODEX_V2_MAINNET, usdcAssets)
    const degenAssetAddresses = await getAssetAddresses(EndpointId.DEGEN_V2_MAINNET, usdcAssets)
    const flareAssetAddresses = await getAssetAddresses(EndpointId.FLARE_V2_MAINNET, usdcAssets)
    const fuseAssetAddresses = await getAssetAddresses(EndpointId.FUSE_V2_MAINNET, usdcAssets)
    const gravityAssetAddresses = await getAssetAddresses(EndpointId.GRAVITY_V2_MAINNET, usdcAssets)
    const iotaAssetAddresses = await getAssetAddresses(EndpointId.IOTA_V2_MAINNET, usdcAssets)
    const islanderAssetAddresses = await getAssetAddresses(EndpointId.ISLANDER_V2_MAINNET, usdcAssets)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_MAINNET, usdcAssets)
    const lightlinkAssetAddresses = await getAssetAddresses(EndpointId.LIGHTLINK_V2_MAINNET, usdcAssets)
    const peaqAssetAddresses = await getAssetAddresses(EndpointId.PEAQ_V2_MAINNET, usdcAssets)
    const plumeAssetAddresses = await getAssetAddresses(EndpointId.PLUME_V2_MAINNET, usdcAssets)
    const raribleAssetAddresses = await getAssetAddresses(EndpointId.RARIBLE_V2_MAINNET, usdcAssets)
    const superpositionAssetAddresses = await getAssetAddresses(EndpointId.SUPERPOSITION_V2_MAINNET, usdcAssets)
    const taikoAssetAddresses = await getAssetAddresses(EndpointId.TAIKO_V2_MAINNET, usdcAssets)
    const xchainAssetAddresses = await getAssetAddresses(EndpointId.XCHAIN_V2_MAINNET, usdcAssets)

    return {
        contracts: [
            {
                contract: codexUSDC,
                config: {
                    owner: codexStargateMultisig,
                    masterMinter: codexStargateMultisig,
                    pauser: codexStargateMultisig,
                    rescuer: codexStargateMultisig,
                    blacklister: codexStargateMultisig,
                    minters: {
                        [codexAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: degenUSDC,
                config: {
                    owner: degenStargateMultisig,
                    masterMinter: degenStargateMultisig,
                    pauser: degenStargateMultisig,
                    rescuer: degenStargateMultisig,
                    blacklister: degenStargateMultisig,
                    minters: {
                        [degenAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: flareUSDC,
                config: {
                    owner: flareStargateMultisig,
                    masterMinter: flareStargateMultisig,
                    pauser: flareStargateMultisig,
                    rescuer: flareStargateMultisig,
                    blacklister: flareStargateMultisig,
                    minters: {
                        [flareAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: fuseUSDC,
                config: {
                    owner: fuseStargateMultisig,
                    masterMinter: fuseStargateMultisig,
                    pauser: fuseStargateMultisig,
                    rescuer: fuseStargateMultisig,
                    blacklister: fuseStargateMultisig,
                    minters: {
                        [fuseAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: gravityUSDC,
                config: {
                    owner: gravityStargateMultisig,
                    masterMinter: gravityStargateMultisig,
                    pauser: gravityStargateMultisig,
                    rescuer: gravityStargateMultisig,
                    blacklister: gravityStargateMultisig,
                    minters: {
                        [gravityAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: iotaUSDC,
                config: {
                    owner: iotaStargateMultisig,
                    masterMinter: iotaStargateMultisig,
                    pauser: iotaStargateMultisig,
                    rescuer: iotaStargateMultisig,
                    blacklister: iotaStargateMultisig,
                    minters: {
                        [iotaAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: islanderUSDC,
                config: {
                    owner: islanderStargateMultisig,
                    masterMinter: islanderStargateMultisig,
                    pauser: islanderStargateMultisig,
                    rescuer: islanderStargateMultisig,
                    blacklister: islanderStargateMultisig,
                    minters: {
                        [islanderAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: klaytnUSDC,
                config: {
                    owner: klaytnStargateMultisig,
                    masterMinter: klaytnStargateMultisig,
                    pauser: klaytnStargateMultisig,
                    rescuer: klaytnStargateMultisig,
                    blacklister: klaytnStargateMultisig,
                    minters: {
                        [klaytnAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: lightlinkUSDC,
                config: {
                    owner: lightlinkStargateMultisig,
                    masterMinter: lightlinkStargateMultisig,
                    pauser: lightlinkStargateMultisig,
                    rescuer: lightlinkStargateMultisig,
                    blacklister: lightlinkStargateMultisig,
                    minters: {
                        [lightlinkAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: peaqUSDC,
                config: {
                    owner: peaqStargateMultisig,
                    masterMinter: peaqStargateMultisig,
                    pauser: peaqStargateMultisig,
                    rescuer: peaqStargateMultisig,
                    blacklister: peaqStargateMultisig,
                    minters: {
                        [peaqAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: plumeUSDC,
                config: {
                    owner: plumeStargateMultisig,
                    masterMinter: plumeStargateMultisig,
                    pauser: plumeStargateMultisig,
                    rescuer: plumeStargateMultisig,
                    blacklister: plumeStargateMultisig,
                    minters: {
                        [plumeAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: raribleUSDC,
                config: {
                    owner: raribleStargateMultisig,
                    masterMinter: raribleStargateMultisig,
                    pauser: raribleStargateMultisig,
                    rescuer: raribleStargateMultisig,
                    blacklister: raribleStargateMultisig,
                    minters: {
                        [raribleAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: superpositionUSDC,
                config: {
                    owner: superpositionStargateMultisig,
                    masterMinter: superpositionStargateMultisig,
                    pauser: superpositionStargateMultisig,
                    rescuer: superpositionStargateMultisig,
                    blacklister: superpositionStargateMultisig,
                    minters: {
                        [superpositionAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: taikoUSDC,
                config: {
                    owner: taikoStargateMultisig,
                    masterMinter: taikoStargateMultisig,
                    pauser: taikoStargateMultisig,
                    rescuer: taikoStargateMultisig,
                    blacklister: taikoStargateMultisig,
                    minters: {
                        [taikoAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
            {
                contract: xchainUSDC,
                config: {
                    owner: xchainStargateMultisig,
                    masterMinter: xchainStargateMultisig,
                    pauser: xchainStargateMultisig,
                    rescuer: xchainStargateMultisig,
                    blacklister: xchainStargateMultisig,
                    minters: {
                        [xchainAssetAddresses.USDC]: 2n ** 256n - 1n,
                    },
                },
            },
        ],
        connections: [],
    }
}

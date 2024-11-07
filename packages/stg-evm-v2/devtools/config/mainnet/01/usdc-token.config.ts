import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import { getSafeAddress } from '../../utils'
import { onFlare, onGravity, onIota, onKlaytn, onLightlink, onPeaq, onRarible, onTaiko, onXchain } from '../utils'

const proxyContract = { contractName: getUSDCProxyDeployName() }
const fiatContract = { contractName: 'FiatTokenV2_2' }

// Except for Peaq where it's deployed externally
const usdcPeaqAsset = getAssetNetworkConfig(EndpointId.PEAQ_V2_MAINNET, TokenName.USDC)
assert(usdcPeaqAsset.address != null, `External USDC address not found for PEAQ`)

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const flareUSDCProxy = await contractFactory(onFlare(proxyContract))
    const gravityUSDCProxy = await contractFactory(onGravity(proxyContract))
    const iotaUSDCProxy = await contractFactory(onIota(proxyContract))
    const klaytnUSDCProxy = await contractFactory(onKlaytn(proxyContract))
    const lightlinkUSDCProxy = await contractFactory(onLightlink(proxyContract))
    const peaqUSDCProxy = await contractFactory(
        onPeaq({ contractName: 'FiatTokenProxy', address: usdcPeaqAsset.address })
    )
    const raribleUSDCProxy = await contractFactory(onRarible(proxyContract))
    const taikoUSDCProxy = await contractFactory(onTaiko(proxyContract))
    const xchainUSDCProxy = await contractFactory(onXchain(proxyContract))

    // Get the corresponding underlying USDC contract
    const flareUSDC = onFlare({ ...fiatContract, address: flareUSDCProxy.contract.address })
    const flareStargateMultisig = getSafeAddress(EndpointId.FLARE_V2_MAINNET)

    const gravityUSDC = onGravity({ ...fiatContract, address: gravityUSDCProxy.contract.address })
    const gravityStargateMultisig = getSafeAddress(EndpointId.GRAVITY_V2_MAINNET)

    const iotaUSDC = onIota({ ...fiatContract, address: iotaUSDCProxy.contract.address })
    const iotaStargateMultisig = getSafeAddress(EndpointId.IOTA_V2_MAINNET)

    const klaytnUSDC = onKlaytn({ ...fiatContract, address: klaytnUSDCProxy.contract.address })
    const klaytnStargateMultisig = getSafeAddress(EndpointId.KLAYTN_V2_MAINNET)

    const lightlinkUSDC = onLightlink({ ...fiatContract, address: lightlinkUSDCProxy.contract.address })
    const lightlinkStargateMultisig = getSafeAddress(EndpointId.LIGHTLINK_V2_MAINNET)

    const peaqUSDC = onPeaq({ ...fiatContract, address: peaqUSDCProxy.contract.address })
    const peaqStargateMultisig = getSafeAddress(EndpointId.PEAQ_V2_MAINNET)

    const raribleUSDC = onRarible({ ...fiatContract, address: raribleUSDCProxy.contract.address })
    const raribleStargateMultisig = getSafeAddress(EndpointId.RARIBLE_V2_MAINNET)

    const taikoUSDC = onTaiko({ ...fiatContract, address: taikoUSDCProxy.contract.address })
    const taikoStargateMultisig = getSafeAddress(EndpointId.TAIKO_V2_MAINNET)

    const xchainUSDC = onXchain({ ...fiatContract, address: xchainUSDCProxy.contract.address })
    const xchainStargateMultisig = getSafeAddress(EndpointId.XCHAIN_V2_MAINNET)

    // Now we collect the address of the deployed assets(StargateOft.sol etc.)
    const usdcAssets = [TokenName.USDC] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const flareAssetAddresses = await getAssetAddresses(EndpointId.FLARE_V2_MAINNET, usdcAssets)
    const gravityAssetAddresses = await getAssetAddresses(EndpointId.GRAVITY_V2_MAINNET, usdcAssets)
    const iotaAssetAddresses = await getAssetAddresses(EndpointId.IOTA_V2_MAINNET, usdcAssets)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_MAINNET, usdcAssets)
    const lightlinkAssetAddresses = await getAssetAddresses(EndpointId.LIGHTLINK_V2_MAINNET, usdcAssets)
    const peaqAssetAddresses = await getAssetAddresses(EndpointId.PEAQ_V2_MAINNET, usdcAssets)
    const raribleAssetAddresses = await getAssetAddresses(EndpointId.RARIBLE_V2_MAINNET, usdcAssets)
    const taikoAssetAddresses = await getAssetAddresses(EndpointId.TAIKO_V2_MAINNET, usdcAssets)
    const xchainAssetAddresses = await getAssetAddresses(EndpointId.XCHAIN_V2_MAINNET, usdcAssets)

    return {
        contracts: [
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

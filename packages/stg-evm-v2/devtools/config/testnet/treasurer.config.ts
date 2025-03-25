import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { TreasurerNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses, getNamedAccount } from '../../../ts-src/utils/util'

import { onArb, onAvalanche, onBL3, onBsc, onEth, onKlaytn, onMantle, onMonad, onOdyssey, onOpt } from './utils'

const contract = { contractName: 'Treasurer' }
const getDeployer = getNamedAccount('deployer')

export default async (): Promise<OmniGraphHardhat<TreasurerNodeConfig, unknown>> => {
    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const eth = await getEnvironment(EndpointId.SEPOLIA_V2_TESTNET)
    const bsc = await getEnvironment(EndpointId.BSC_V2_TESTNET)
    const opt = await getEnvironment(EndpointId.OPTSEP_V2_TESTNET)
    const arb = await getEnvironment(EndpointId.ARBSEP_V2_TESTNET)
    const avalanche = await getEnvironment(EndpointId.AVALANCHE_V2_TESTNET)
    const klaytn = await getEnvironment(EndpointId.KLAYTN_V2_TESTNET)
    const bl3 = await getEnvironment(EndpointId.BL3_V2_TESTNET)
    const odyssey = await getEnvironment(EndpointId.ODYSSEY_V2_TESTNET)
    const mantle = await getEnvironment(EndpointId.MANTLESEP_V2_TESTNET)
    const monad = await getEnvironment(EndpointId.MONAD_V2_TESTNET)

    // Then grab the deployer account for each network to be used as the admin
    const ethAdmin = await eth.getNamedAccounts().then(getDeployer)
    const bscAdmin = await bsc.getNamedAccounts().then(getDeployer)
    const optAdmin = await opt.getNamedAccounts().then(getDeployer)
    const arbAdmin = await arb.getNamedAccounts().then(getDeployer)
    const avalancheAdmin = await avalanche.getNamedAccounts().then(getDeployer)
    const klaytnAdmin = await klaytn.getNamedAccounts().then(getDeployer)
    const bl3Admin = await bl3.getNamedAccounts().then(getDeployer)
    const odysseyAdmin = await odyssey.getNamedAccounts().then(getDeployer)
    const mantleAdmin = await mantle.getNamedAccounts().then(getDeployer)
    const monadAdmin = await monad.getNamedAccounts().then(getDeployer)

    // Now we collect the address of the deployed assets
    const allAssets = [TokenName.USDT, TokenName.USDC, TokenName.ETH] as const
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const ethAssetAddresses = await getAssetAddresses(EndpointId.SEPOLIA_V2_TESTNET, allAssets)
    const bscAssetAddresses = await getAssetAddresses(EndpointId.BSC_V2_TESTNET, [TokenName.USDT] as const)
    const optAssetAddresses = await getAssetAddresses(EndpointId.OPTSEP_V2_TESTNET, allAssets)
    const arbAssetAddresses = await getAssetAddresses(EndpointId.ARBSEP_V2_TESTNET, allAssets)
    const avalancheAssetAddresses = await getAssetAddresses(EndpointId.AVALANCHE_V2_TESTNET, [TokenName.USDT] as const)
    const klaytnAssetAddresses = await getAssetAddresses(EndpointId.KLAYTN_V2_TESTNET, allAssets)
    const bl3AssetAddresses = await getAssetAddresses(EndpointId.BL3_V2_TESTNET, allAssets)
    const odysseyAssetAddresses = await getAssetAddresses(EndpointId.ODYSSEY_V2_TESTNET, allAssets)
    const mantleAssetAddresses = await getAssetAddresses(EndpointId.MANTLESEP_V2_TESTNET, allAssets)
    const monadAssetAddresses = await getAssetAddresses(EndpointId.MONAD_V2_TESTNET, allAssets)

    return {
        contracts: [
            {
                contract: onEth(contract),
                config: {
                    admin: ethAdmin,
                    assets: {
                        [ethAssetAddresses.USDT]: true,
                        [ethAssetAddresses.USDC]: true,
                        [ethAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onBsc(contract),
                config: {
                    admin: bscAdmin,
                    assets: {
                        [bscAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onOpt(contract),
                config: {
                    admin: optAdmin,
                    assets: {
                        [optAssetAddresses.USDT]: true,
                        [optAssetAddresses.USDC]: true,
                        [optAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onArb(contract),
                config: {
                    admin: arbAdmin,
                    assets: {
                        [arbAssetAddresses.USDT]: true,
                        [arbAssetAddresses.USDC]: true,
                        [arbAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onAvalanche(contract),
                config: {
                    admin: avalancheAdmin,
                    assets: {
                        [avalancheAssetAddresses.USDT]: true,
                    },
                },
            },
            {
                contract: onKlaytn(contract),
                config: {
                    admin: klaytnAdmin,
                    assets: {
                        [klaytnAssetAddresses.USDT]: true,
                        [klaytnAssetAddresses.USDC]: true,
                        [klaytnAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onBL3(contract),
                config: {
                    admin: bl3Admin,
                    assets: {
                        [bl3AssetAddresses.USDT]: true,
                        [bl3AssetAddresses.USDC]: true,
                        [bl3AssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onOdyssey(contract),
                config: {
                    admin: odysseyAdmin,
                    assets: {
                        [odysseyAssetAddresses.USDT]: true,
                        [odysseyAssetAddresses.USDC]: true,
                        [odysseyAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onMantle(contract),
                config: {
                    admin: mantleAdmin,
                    assets: {
                        [mantleAssetAddresses.USDT]: true,
                        [mantleAssetAddresses.USDC]: true,
                        [mantleAssetAddresses.ETH]: true,
                    },
                },
            },
            {
                contract: onMonad(contract),
                config: {
                    admin: monadAdmin,
                    assets: {
                        [monadAssetAddresses.USDT]: true,
                        [monadAssetAddresses.USDC]: true,
                        [monadAssetAddresses.ETH]: true,
                    },
                },
            },
        ],
        connections: [],
    }
}

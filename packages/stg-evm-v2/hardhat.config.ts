import { dirname, join } from 'path'

import { configDotenv } from 'dotenv'

// Configure the environment variables
configDotenv({
    path: ['.env.local', '.env'],
})

import { AsyncRetriable } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getSafeConfig } from './devtools/config/utils'

import type { HDAccountsUserConfig, HardhatUserConfig, NetworksUserConfig } from 'hardhat/types'

import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import '@nomiclabs/hardhat-etherscan'
import '@matterlabs/hardhat-zksync-solc'
import '@matterlabs/hardhat-zksync-deploy'
import 'hardhat-deploy'
import 'hardhat-deploy-ethers'
import 'hardhat-gas-reporter'
import 'hardhat-contract-sizer'
import 'hardhat-spdx-license-identifier'
import 'solidity-coverage'

import '@layerzerolabs/toolbox-hardhat'

import '@typechain/hardhat'

// Devtools-specific tasks
import './devtools/tasks'

AsyncRetriable.config = {
    enabled: true,
    numAttempts: process.env.NUM_RETRIES ? parseInt(process.env.NUM_RETRIES) : 5,
    maxDelay: 1_000,
    onRetry: (attemptNum, totalNumRetries, error) => {
        console.log(`Attempt ${attemptNum}/${totalNumRetries}: ${error} \n`)
    },
}
const v1Deployments = join(dirname(require.resolve('@stargatefinance/stg-evm-v1/package.json')), 'deployments')

/**
 * The local simulation nodes' performance can vary based on the machine
 * it's running on. For large transactions, this can exceed the default network timeout
 * and result in a `HeadersTimeoutError`.
 *
 * We bump this to an extremely large value (600s) to avoid these issues
 *
 * See https://github.com/NomicFoundation/hardhat/issues/3136
 * See https://github.com/NomicFoundation/hardhat/issues/2672#issuecomment-1167409582
 */
const DEFAULT_NETWORK_TIMEOUT = 600_000

const TEST_MNEMONIC = 'test test test test test test test test test test test junk'

const sandboxAccounts: HDAccountsUserConfig = {
    mnemonic: process.env.MNEMONIC_SANDBOX || process.env.MNEMONIC || TEST_MNEMONIC,
    count: 300,
}

const testnetAccounts: HDAccountsUserConfig = {
    mnemonic: process.env.MNEMONIC_TESTNET || process.env.MNEMONIC || TEST_MNEMONIC,
}

const mainnetAccounts: HDAccountsUserConfig = {
    // using Test mnemonic for mainnet to use it in the tests, in case they are not set in the env variable
    mnemonic: process.env.MNEMONIC_MAINNET || process.env.MNEMONIC || TEST_MNEMONIC,
}

const hardhatNamedAccounts: HardhatUserConfig = {
    namedAccounts: {
        deployer: {
            'ethereum-sandbox-local': '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
            'bsc-sandbox-local': '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
            'polygon-sandbox-local': '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
            default: 0,
        },
        planner: {
            'ethereum-sandbox-local': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            'bsc-sandbox-local': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            'polygon-sandbox-local': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            default: 1,
        },
        treasurer: {
            'ethereum-sandbox-local': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            'bsc-sandbox-local': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            'polygon-sandbox-local': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            default: 2,
        },
        tokenAdmin: {
            default: 3, // 0x126A13528A923EF289B5b72FFFD6c4a198F91Db4
        },
    },
}

const networks: NetworksUserConfig = {
    //
    // Localnet
    //
    'bsc-sandbox-local': {
        eid: EndpointId.BSC_V2_SANDBOX,
        isLocalEid: true,
        url: 'http://localhost:8502',
        accounts: sandboxAccounts,
        // We'll include this flag just to have it enabled for one network on sandbox
        useFeeData: true,
    },
    'ethereum-sandbox-local': {
        eid: EndpointId.ETHEREUM_V2_SANDBOX,
        isLocalEid: true,
        url: 'http://localhost:8501',
        accounts: sandboxAccounts,
    },
    'polygon-sandbox-local': {
        eid: EndpointId.POLYGON_V2_SANDBOX,
        isLocalEid: true,
        url: 'http://localhost:8509',
        accounts: sandboxAccounts,
    },

    //
    // Testnet
    //
    'arbsep-testnet': {
        eid: EndpointId.ARBSEP_V2_TESTNET,
        url: process.env.RPC_URL_ARBITRUM_TESTNET || 'https://sepolia-rollup.arbitrum.io/rpc',
        accounts: testnetAccounts,
        useFeeData: true,
    },
    'avalanche-testnet': {
        eid: EndpointId.AVALANCHE_V2_TESTNET,
        url: process.env.RPC_URL_AVALANCHE_TESTNET || 'https://api.avax-test.network/ext/bc/C/rpc',
        accounts: testnetAccounts,
    },
    'bsc-testnet': {
        eid: EndpointId.BSC_V2_TESTNET,
        url: process.env.RPC_URL_BSC_TESTNET || 'https://bsc-testnet-rpc.publicnode.com',
        accounts: testnetAccounts,
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'klaytn-testnet': {
        eid: EndpointId.KLAYTN_V2_TESTNET,
        url: process.env.RPC_URL_KLAYTN_TESTNET || 'https://kaia-kairos.blockpi.network/v1/rpc/public',
        accounts: testnetAccounts,
    },
    'mantlesep-testnet': {
        eid: EndpointId.MANTLESEP_V2_TESTNET,
        url: process.env.RPC_URL_MANTLE_TESTNET || 'https://rpc.sepolia.mantle.xyz',
        accounts: testnetAccounts,
    },
    'optsep-testnet': {
        eid: EndpointId.OPTSEP_V2_TESTNET,
        url: process.env.RPC_URL_OPTIMISM_TESTNET || 'https://sepolia.optimism.io',
        accounts: testnetAccounts,
    },
    'sepolia-testnet': {
        eid: EndpointId.SEPOLIA_V2_TESTNET,
        url: process.env.RPC_URL_ETHEREUM_TESTNET || 'https://sepolia.gateway.tenderly.co',
        accounts: testnetAccounts,
    },
    'monad-testnet': {
        eid: EndpointId.MONAD_V2_TESTNET,
        url: process.env.RPC_URL_MONAD_TESTNET || 'https://testnet-rpc.monad.xyz',
        accounts: testnetAccounts,
    },

    //
    // Mainnet
    //
    'abstract-mainnet': {
        eid: EndpointId.ABSTRACT_V2_MAINNET,
        url: process.env.RPC_URL_ABSTRACT_MAINNET || 'https://api.mainnet.abs.xyz',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ABSTRACT_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
        zksync: true,
        ethNetwork: 'ethereum-mainnet',
    },
    'ape-mainnet': {
        eid: EndpointId.APE_V2_MAINNET,
        url: process.env.RPC_URL_APE_MAINNET || 'https://apechain.drpc.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.APE_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'arbitrum-mainnet': {
        eid: EndpointId.ARBITRUM_V2_MAINNET,
        url: process.env.RPC_URL_ARBITRUM_MAINNET || 'https://arb1.arbitrum.io/rpc',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ARBITRUM_V2_MAINNET),
        useFeeData: true,
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'astar-mainnet': {
        eid: EndpointId.ASTAR_V2_MAINNET,
        url: process.env.RPC_URL_ASTAR_MAINNET || 'https://evm.astar.network',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ASTAR_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'aurora-mainnet': {
        eid: EndpointId.AURORA_V2_MAINNET,
        url: process.env.RPC_URL_AURORA_MAINNET || 'https://aurora.drpc.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.AURORA_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'avalanche-mainnet': {
        eid: EndpointId.AVALANCHE_V2_MAINNET,
        url: process.env.RPC_URL_AVALANCHE_MAINNET || 'https://avalanche-c-chain-rpc.publicnode.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.AVALANCHE_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'base-mainnet': {
        eid: EndpointId.BASE_V2_MAINNET,
        url: process.env.RPC_URL_BASE_MAINNET || 'https://base-pokt.nodies.app',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.BASE_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'bera-mainnet': {
        eid: EndpointId.BERA_V2_MAINNET,
        url: process.env.RPC_URL_BERA_MAINNET || 'https://rpc.berachain-apis.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.BERA_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'blast-mainnet': {
        eid: EndpointId.BLAST_V2_MAINNET,
        url: process.env.RPC_URL_BLAST_MAINNET || 'https://blast-rpc.publicnode.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.BLAST_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'botanix-mainnet': {
        eid: EndpointId.BOTANIX_V2_MAINNET,
        url: process.env.RPC_URL_BOTANIX_MAINNET || 'https://rpc.botanixlabs.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.BOTANIX_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'bsc-mainnet': {
        eid: EndpointId.BSC_V2_MAINNET,
        url: process.env.RPC_URL_BSC_MAINNET || 'https://bsc-rpc.publicnode.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.BSC_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'codex-mainnet': {
        eid: EndpointId.CODEX_V2_MAINNET,
        url: process.env.RPC_URL_CODEX_MAINNET || 'https://rpc.codex.xyz',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.CODEX_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'coredao-mainnet': {
        eid: EndpointId.COREDAO_V2_MAINNET,
        url: process.env.RPC_URL_COREDAO_MAINNET || 'https://rpc.coredao.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.COREDAO_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'cronosevm-mainnet': {
        eid: EndpointId.CRONOSEVM_V2_MAINNET,
        url: process.env.RPC_URL_CRONOSEVM_MAINNET || 'https://evm.cronos.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.CRONOSEVM_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'cronoszkevm-mainnet': {
        eid: EndpointId.CRONOSZKEVM_V2_MAINNET,
        url: process.env.RPC_URL_CRONOSZKEVM_MAINNET || 'https://mainnet.zkevm.cronos.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.CRONOSZKEVM_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
        zksync: true,
        ethNetwork: 'ethereum-mainnet',
    },
    'degen-mainnet': {
        eid: EndpointId.DEGEN_V2_MAINNET,
        url: process.env.RPC_URL_DEGEN_MAINNET || 'https://rpc.degen.tips',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.DEGEN_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'edu-mainnet': {
        eid: EndpointId.EDU_V2_MAINNET,
        url: process.env.RPC_URL_EDU_MAINNET || 'https://rpc.edu-chain.raas.gelato.cloud',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.EDU_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'ethereum-mainnet': {
        eid: EndpointId.ETHEREUM_V2_MAINNET,
        url: process.env.RPC_URL_ETHEREUM_MAINNET || 'https://rpc.payload.de',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ETHEREUM_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'etherlink-mainnet': {
        eid: EndpointId.ETHERLINK_V2_MAINNET,
        url: process.env.RPC_URL_ETHERLINK_MAINNET || 'https://node.mainnet.etherlink.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ETHERLINK_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'fantom-mainnet': {
        eid: EndpointId.FANTOM_V2_MAINNET,
        url: process.env.RPC_URL_FANTOM_MAINNET || 'https://fantom-rpc.publicnode.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.FANTOM_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'flare-mainnet': {
        eid: EndpointId.FLARE_V2_MAINNET,
        url: process.env.RPC_URL_FLARE_MAINNET || 'https://flare-api.flare.network/ext/C/rpc',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.FLARE_V2_MAINNET),
    },
    'flow-mainnet': {
        eid: EndpointId.FLOW_V2_MAINNET,
        url: process.env.RPC_URL_FLOW_MAINNET || 'https://mainnet.evm.nodes.onflow.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.FLOW_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'fraxtal-mainnet': {
        eid: EndpointId.FRAXTAL_V2_MAINNET,
        url: process.env.RPC_URL_FRAXTAL_MAINNET || 'https://rpc.frax.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.FRAXTAL_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'fuse-mainnet': {
        eid: EndpointId.FUSE_V2_MAINNET,
        url: process.env.RPC_URL_FUSE_MAINNET || 'https://rpc.fuse.io',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.FUSE_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'glue-mainnet': {
        eid: EndpointId.GLUE_V2_MAINNET,
        url: process.env.RPC_URL_GLUE_MAINNET || 'https://rpc.glue.net',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.GLUE_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'gnosis-mainnet': {
        eid: EndpointId.GNOSIS_V2_MAINNET,
        url: process.env.RPC_URL_GNOSIS_MAINNET || 'https://gnosis.drpc.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.GNOSIS_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'goat-mainnet': {
        eid: EndpointId.GOAT_V2_MAINNET,
        url: process.env.RPC_URL_GOAT_MAINNET || 'https://rpc.goat.network',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.GOAT_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'gravity-mainnet': {
        eid: EndpointId.GRAVITY_V2_MAINNET,
        url: process.env.RPC_URL_GRAVITY_MAINNET || 'https://rpc.gravity.xyz',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.GRAVITY_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'hedera-mainnet': {
        eid: EndpointId.HEDERA_V2_MAINNET,
        url: process.env.RPC_URL_HEDERA_MAINNET || 'https://mainnet.hashio.io/api',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.HEDERA_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'hemi-mainnet': {
        eid: EndpointId.HEMI_V2_MAINNET,
        url: process.env.RPC_URL_HEMI_MAINNET || 'https://7e57304f.rpc.hemi.network/rpc',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.HEMI_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'ink-mainnet': {
        eid: EndpointId.INK_V2_MAINNET,
        url: process.env.RPC_URL_INK_MAINNET || 'https://rpc-gel.inkonchain.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.INK_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'iota-mainnet': {
        eid: EndpointId.IOTA_V2_MAINNET,
        url: process.env.RPC_URL_IOTA_MAINNET || 'https://json-rpc.evm.iotaledger.net',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.IOTA_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'islander-mainnet': {
        eid: EndpointId.ISLANDER_V2_MAINNET,
        url: process.env.RPC_URL_ISLANDER_MAINNET || 'https://evm-rpc-vana.josephtran.xyz',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ISLANDER_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'kava-mainnet': {
        eid: EndpointId.KAVA_V2_MAINNET,
        url: process.env.RPC_URL_KAVA_MAINNET || 'https://kava-pokt.nodies.app',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.KAVA_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'klaytn-mainnet': {
        eid: EndpointId.KLAYTN_V2_MAINNET,
        url: process.env.RPC_URL_KLAYTN_MAINNET || 'https://rpc.ankr.com/klaytn',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.KLAYTN_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'lightlink-mainnet': {
        eid: EndpointId.LIGHTLINK_V2_MAINNET,
        url: process.env.RPC_URL_LIGHTLINK_MAINNET || 'https://replicator.phoenix.lightlink.io/rpc/v1',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.LIGHTLINK_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'manta-mainnet': {
        eid: EndpointId.MANTA_V2_MAINNET,
        url: process.env.RPC_URL_MANTA_MAINNET || 'https://pacific-rpc.manta.network/http',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.MANTA_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'mantle-mainnet': {
        eid: EndpointId.MANTLE_V2_MAINNET,
        url: process.env.RPC_URL_MANTLE_MAINNET || 'https://mantle-mainnet.public.blastapi.io',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.MANTLE_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'metis-mainnet': {
        eid: EndpointId.METIS_V2_MAINNET,
        url: process.env.RPC_URL_METIS_MAINNET || 'https://metis-pokt.nodies.app',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.METIS_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'mode-mainnet': {
        eid: EndpointId.MODE_V2_MAINNET,
        url: process.env.RPC_URL_MODE_MAINNET || 'https://mainnet.mode.network',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.MODE_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'moonbeam-mainnet': {
        eid: EndpointId.MOONBEAM_V2_MAINNET,
        url: process.env.RPC_URL_MOONBEAM_MAINNET || 'https://rpc.api.moonbeam.network',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.MOONBEAM_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'moonriver-mainnet': {
        eid: EndpointId.MOONRIVER_V2_MAINNET,
        url: process.env.RPC_URL_MOONRIVER_MAINNET || 'https://moonriver-rpc.publicnode.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.MOONRIVER_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'nibiru-mainnet': {
        eid: EndpointId.NIBIRU_V2_MAINNET,
        url: process.env.RPC_URL_NIBIRU_MAINNET || 'https://evm-rpc.nibiru.fi',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.NIBIRU_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'opbnb-mainnet': {
        eid: EndpointId.OPBNB_V2_MAINNET,
        url: process.env.RPC_URL_OPBNB_MAINNET || 'https://opbnb-mainnet-rpc.bnbchain.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.OPBNB_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'optimism-mainnet': {
        eid: EndpointId.OPTIMISM_V2_MAINNET,
        url: process.env.RPC_URL_OPTIMISM_MAINNET || 'https://optimism.drpc.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.OPTIMISM_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'orderly-mainnet': {
        eid: EndpointId.ORDERLY_V2_MAINNET,
        url: process.env.RPC_URL_ORDERLY_MAINNET || 'https://rpc.orderly.network',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ORDERLY_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'peaq-mainnet': {
        eid: EndpointId.PEAQ_V2_MAINNET,
        url: process.env.RPC_URL_PEAQ_MAINNET || 'https://peaq.api.onfinality.io/public',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.PEAQ_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'plume-mainnet': {
        eid: EndpointId.PLUME_V2_MAINNET,
        url: process.env.RPC_URL_PLUME_MAINNET || 'https://rpc.plumenetwork.xyz',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.PLUME_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'plumephoenix-mainnet': {
        eid: EndpointId.PLUMEPHOENIX_V2_MAINNET,
        url: process.env.RPC_URL_PLUMEPHOENIX_MAINNET || 'https://rpc.plume.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.PLUMEPHOENIX_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'polygon-mainnet': {
        eid: EndpointId.POLYGON_V2_MAINNET,
        url: process.env.RPC_URL_POLYGON_MAINNET || 'https://polygon.drpc.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.POLYGON_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'rarible-mainnet': {
        eid: EndpointId.RARIBLE_V2_MAINNET,
        url: process.env.RPC_URL_RARIBLE_MAINNET || 'https://mainnet.rpc.rarichain.org/http',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.RARIBLE_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'rootstock-mainnet': {
        eid: EndpointId.ROOTSTOCK_V2_MAINNET,
        url: process.env.RPC_URL_ROOTSTOCK_V2_MAINNET || 'https://public-node.rsk.co',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ROOTSTOCK_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'scroll-mainnet': {
        eid: EndpointId.SCROLL_V2_MAINNET,
        url: process.env.RPC_URL_SCROLL_MAINNET || 'https://scroll.api.onfinality.io/public',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SCROLL_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'sei-mainnet': {
        eid: EndpointId.SEI_V2_MAINNET,
        url: process.env.RPC_URL_SEI_MAINNET || 'https://evm-rpc.sei-apis.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SEI_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
        // Sei is giving us ProviderError: Out of gas: gas required exceeds allowance errors
        useFeeData: true,
    },
    'shimmer-mainnet': {
        eid: EndpointId.SHIMMER_V2_MAINNET,
        url: process.env.RPC_URL_SHIMMER_MAINNET || 'https://json-rpc.evm.shimmer.network',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SHIMMER_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'sophon-mainnet': {
        eid: EndpointId.SOPHON_V2_MAINNET,
        url: process.env.RPC_URL_SOPHON_MAINNET || 'https://rpc.sophon.xyz',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SOPHON_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
        zksync: true,
        ethNetwork: 'ethereum-mainnet',
    },
    'somnia-mainnet': {
        eid: EndpointId.SOMNIA_V2_MAINNET,
        url: process.env.RPC_URL_SOMNIA_MAINNET || 'https://api.infra.mainnet.somnia.network/',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SOMNIA_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'soneium-mainnet': {
        eid: EndpointId.SONEIUM_V2_MAINNET,
        url: process.env.RPC_URL_SONEIUM_MAINNET || 'https://rpc.soneium.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SONEIUM_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'sonic-mainnet': {
        eid: EndpointId.SONIC_V2_MAINNET,
        url: process.env.RPC_URL_SONIC_MAINNET || 'https://rpc.soniclabs.com',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SONIC_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'story-mainnet': {
        eid: EndpointId.STORY_V2_MAINNET,
        url: process.env.RPC_URL_STORY_MAINNET || 'https://mainnet.storyrpc.io',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.STORY_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'superposition-mainnet': {
        eid: EndpointId.SUPERPOSITION_V2_MAINNET,
        url: process.env.RPC_URL_SUPERPOSITION_MAINNET || 'https://rpc.superposition.so',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SUPERPOSITION_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'swell-mainnet': {
        eid: EndpointId.SWELL_V2_MAINNET,
        url: process.env.RPC_URL_SWELL_MAINNET || 'https://swell-mainnet.alt.technology',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.SWELL_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'taiko-mainnet': {
        eid: EndpointId.TAIKO_V2_MAINNET,
        url: process.env.RPC_URL_TAIKO_MAINNET || 'https://rpc.mainnet.taiko.xyz',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.TAIKO_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
        gasPrice: 20000000,
    },
    'telos-mainnet': {
        eid: EndpointId.TELOS_V2_MAINNET,
        url: process.env.RPC_URL_TELOS_MAINNET || 'https://rpc.telos.net',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.TELOS_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'unichain-mainnet': {
        eid: EndpointId.UNICHAIN_V2_MAINNET,
        url: process.env.RPC_URL_UNICHAIN_MAINNET || 'https://mainnet.unichain.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.UNICHAIN_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'xchain-mainnet': {
        eid: EndpointId.XCHAIN_V2_MAINNET,
        url: process.env.RPC_URL_XCHAIN_MAINNET || 'https://xchain-rpc.idex.io/',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.XCHAIN_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'xdc-mainnet': {
        eid: EndpointId.XDC_V2_MAINNET,
        url: process.env.RPC_URL_XDC_MAINNET || 'https://rpc.xdc.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.XDC_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'zkconsensys-mainnet': {
        eid: EndpointId.ZKCONSENSYS_V2_MAINNET,
        url: process.env.RPC_URL_ZKCONSENSYS_MAINNET || 'https://linea.drpc.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ZKCONSENSYS_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'zkpolygon-mainnet': {
        eid: EndpointId.ZKPOLYGON_V2_MAINNET,
        url: process.env.RPC_URL_ZKPOLYGON_MAINNET || 'https://polygon-zkevm.drpc.org',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ZKPOLYGON_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
    },
    'zksync-mainnet': {
        eid: EndpointId.ZKSYNC_V2_MAINNET,
        url: process.env.RPC_URL_ZKSYNC_MAINNET || 'https://mainnet.era.zksync.io',
        accounts: mainnetAccounts,
        safeConfig: getSafeConfig(EndpointId.ZKSYNC_V2_MAINNET),
        timeout: DEFAULT_NETWORK_TIMEOUT,
        zksync: true,
        ethNetwork: 'ethereum-mainnet',
    },
}

// We'll connect V1 deployments so that we can access them when deploying e.g. zapper
const externalConfig: HardhatUserConfig['external'] = {
    deployments: Object.fromEntries(
        Object.keys(networks).map((networkName) => [networkName, [join(v1Deployments, networkName)]] as const)
    ),
}

const hardhatConfig: Partial<HardhatUserConfig> = {
    defaultNetwork: 'hardhat',
    mocha: {
        timeout: 50000,
    },
    layerZero: {
        experimental: {
            simulation: {
                anvil: {
                    timeout: DEFAULT_NETWORK_TIMEOUT,
                    pruneHistory: true,
                },
            },
        },
    },
    solidity: {
        eraVersion: '1.0.0',
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 5000,
                    },
                },
            },
            {
                version: '0.8.17',
                settings: {
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 20000,
                    },
                },
            },
        ],
    },
    zksolc: {
        version: '1.5.7',
        compilerSource: 'binary',
        settings: {
            // See https://github.com/zkSync-Community-Hub/zksync-developers/discussions/218#discussioncomment-7994804
            libraries: {
                // Since we are not deploying USDC on zksync-mainnet, we can safely get around zksolc compiler
                // errors by specifying a zero address for a missing library
                'src/usdc/impl/util/SignatureChecker.sol': {
                    // Testnet one
                    // SignatureChecker: '0xaB9F13d3752f7b68F2A260A066DdE105f52A1f85',
                    // Mainnet one
                    SignatureChecker: '0xfE9034963f90789648aE12E3AE08E0303B0aF2FC',
                },
            },
            optimizer: {
                mode: 'z',
                enabled: true,
            },
        },
    },
    // options for hardhat-spdx-license-identifier
    spdxLicenseIdentifier: {
        overwrite: false,
        runOnCompile: true,
    },
    // options for hardhat-gas-reporter
    gasReporter: {
        currency: 'USD',
        enabled: process.env.REPORT_GAS === 'true',
        excludeContracts: ['contracts/libraries/'],
    },
    // options for @typechain/hardhat
    typechain: {
        outDir: './ts-src/typechain-types',
        target: 'ethers-v5',
        alwaysGenerateOverloads: false,
        dontOverrideCompile: false,
    },
    paths: {
        sources: './src',
        cache: 'cache/hardhat',
    },
    external: externalConfig,
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
    },
}

const getRpcUrl = (chainName: string): string | null => {
    const [chainRawName, chainType] = chainName.split('-', 2)
    if (!chainType || !chainRawName) return null

    let templateUrl

    switch (chainType) {
        case 'testnet':
            templateUrl = process.env.RPC_URL_TESTNET
            break
        case 'mainnet':
            templateUrl = process.env.RPC_URL_MAINNET
            break
        default:
            return null
    }

    const url = templateUrl?.replace('CHAIN', chainRawName) ?? null
    return url
}

const updateNetworkRpcUrls = (networks: NetworksUserConfig): NetworksUserConfig => {
    return Object.fromEntries(
        Object.entries(networks).map(([networkName, networkConfig]) => {
            if (networkConfig && 'url' in networkConfig) {
                const dynamicUrl = getRpcUrl(networkName)
                return [networkName, { ...networkConfig, url: dynamicUrl ?? networkConfig.url }]
            }
            return [networkName, networkConfig]
        })
    )
}

const hardhatNetworks: Pick<HardhatUserConfig, 'networks'> = {
    networks: {
        localhost: {
            accounts: sandboxAccounts,
        },
        hardhat: {
            accounts: sandboxAccounts,
            blockGasLimit: 30_000_000,
            throwOnCallFailures: false,
            allowUnlimitedContractSize: true,
        },
        ...updateNetworkRpcUrls(networks),
    },
}

const config: HardhatUserConfig = {
    ...hardhatNamedAccounts,
    ...hardhatConfig,
    ...hardhatNetworks,
}

// FIXME What the windows vista is this
if (process.argv[2] !== 'compile') {
    // the following tasks require the contracts to be compiled,
    // so we don't want to load them when compiling
    require('./tasks')
}
export default config

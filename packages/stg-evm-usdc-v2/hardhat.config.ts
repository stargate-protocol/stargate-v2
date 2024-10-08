import { configDotenv } from 'dotenv'

// Configure the environment variables
configDotenv({
    path: ['.env.local', '.env'],
})

import { EndpointId } from '@layerzerolabs/lz-definitions'

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

const sandboxAccounts: HDAccountsUserConfig = {
    mnemonic:
        process.env.MNEMONIC_SANDBOX ||
        process.env.MNEMONIC ||
        'test test test test test test test test test test test junk',
    count: 300,
}

const testnetAccounts: HDAccountsUserConfig = {
    mnemonic: process.env.MNEMONIC_TESTNET || process.env.MNEMONIC || '',
}

const hardhatNamedAccounts: HardhatUserConfig = {
    namedAccounts: {
        deployer: {
            default: 0,
        },
        planner: {
            default: 1,
        },
        treasurer: {
            default: 2,
        },
        usdcAdmin: {
            default: 3,
        },
    },
}

const networks: NetworksUserConfig = {
    //
    // Testnet
    //
    'klaytn-testnet': {
        eid: EndpointId.KLAYTN_V2_TESTNET,
        url: process.env.RPC_URL_KLAYTN_TESTNET || 'https://public-en-baobab.klaytn.net',
        accounts: testnetAccounts,
    },
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
                version: '0.6.12',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 10_000_000,
                    },
                },
            },
        ],
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
    },
    paths: {
        sources: './src',
        cache: 'cache/hardhat',
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
    },
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
        },
        ...networks,
    },
}

const config: HardhatUserConfig = {
    ...hardhatNamedAccounts,
    ...hardhatConfig,
    ...hardhatNetworks,
}

export default config

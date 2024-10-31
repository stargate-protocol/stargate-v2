import 'dotenv/config'

import type { HardhatUserConfig } from 'hardhat/types'
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-deploy'
import 'hardhat-deploy-ethers'

const accounts = {
    mnemonic: process.env.MNEMONIC || '',
}

const config: HardhatUserConfig = {
    namedAccounts: {
        deployer: { default: 0 },
        alice: { default: 1 },
        bob: { default: 2 },
        carol: { default: 3 },
    },
    networks: {
        'celo-mainnet': {
            url: 'https://forno.celo.org',
            accounts,
            chainId: 42220,
            saveDeployments: true,
            live: true,
            tags: ['prod'],
        },
        'alfajores-testnet': {
            url: 'https://alfajores-forno.celo-testnet.org',
            accounts,
            chainId: 44787,
            saveDeployments: true,
            live: true,
            tags: ['prod'],
        },
        'kava-mainnet': {
            url: 'https://rpc.ankr.com/kava_evm',
            accounts,
            chainId: 2222,
            saveDeployments: true,
            live: true,
            tags: ['prod'],
        },
        'avalanche-mainnet': {
            url: 'https://avalanche.public-rpc.com',
            chainId: 43114,
            accounts,
        },
        'ethereum-mainnet': {
            url: process.env.ETHEREUM_RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts,
            chainId: 1,
            saveDeployments: true,
            live: true,
            tags: ['prod'],
        },
        'sepolia-testnet': {
            url: process.env.RPC_URL_ETHEREUM_TESTNET || 'https://ethereum-sepolia-rpc.publicnode.com',
            accounts,
            chainId: 11155111,
            saveDeployments: true,
        },
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_TOKEN || '',
            ropsten: process.env.ETHERSCAN_TOKEN || '',
            kovan: process.env.ETHERSCAN_TOKEN || '',
            optimisticEthereum: process.env.ETHERSCAN_TOKEN || '',
            arbitrumOne: process.env.ARBISCAN_TOKEN || '',
            avalanche: process.env.ETHERSCAN_TOKEN || '',
            opera: process.env.ETHERSCAN_TOKEN || '',
            bsc: process.env.BSCSCAN_TOKEN || '',
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.6.2',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100000,
                    },
                },
            },
            {
                version: '0.8.4',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100000,
                    },
                },
            },
        ],
    },
    external: {
        contracts: [{ artifacts: 'node_modules/@openzeppelin/upgrades-core/artifacts/' }],
    },
}

export default config

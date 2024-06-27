// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import "dotenv/config"

import "@nomicfoundation/hardhat-ethers"
import "hardhat-deploy-ethers"
import "hardhat-deploy"
import "hardhat-contract-sizer"
import "@nomiclabs/hardhat-ethers"
import "@layerzerolabs/toolbox-hardhat"
import "solidity-coverage"
import { EndpointId } from "@layerzerolabs/lz-definitions"

import type { HDAccountsUserConfig, HardhatUserConfig } from "hardhat/types"

const testnetAccounts: HDAccountsUserConfig = {
    mnemonic: process.env.MNEMONIC_TESTNET || process.env.MNEMONIC || "",
}

const config: HardhatUserConfig = {
    paths: {
        cache: "cache/hardhat",
    },
    solidity: {
        compilers: [
            {
                version: "0.8.22",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        //
        // TESTNET
        //
        "arbsep-testnet": {
            eid: EndpointId.ARBSEP_V2_TESTNET,
            url: process.env.RPC_URL_SEPOLIA || "https://public.stackup.sh/api/v1/node/arbitrum-sepolia",
            accounts: testnetAccounts,
        },
        "optsep-testnet": {
            eid: EndpointId.OPTSEP_V2_TESTNET,
            url: process.env.RPC_URL_AMOY || "https://endpoints.omniatech.io/v1/op/sepolia/public",
            accounts: testnetAccounts,
        },
        "bsc-testnet": {
            eid: EndpointId.BSC_V2_TESTNET,
            url: process.env.RPC_URL_AMOY || "https://bsc-testnet-rpc.publicnode.com",
            accounts: testnetAccounts,
        },
        //
        // MAINNET
        //

        hardhat: {
            accounts: {
                count: 1000,
                accountsBalance: "1000000000000000000000000",
            },
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
}

export default config

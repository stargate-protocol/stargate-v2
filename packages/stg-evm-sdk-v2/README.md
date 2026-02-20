# Stargate EVM SDK V2

The Stargate EVM SDK V2 (`@stargatefinance/stg-evm-sdk-v2`) is a comprehensive software development kit designed for interacting with Stargate contracts on the Ethereum Virtual Machine (EVM) compatible blockchains by supplying essential information and utilities. 

## Features

- **Cross-Chain Asset Transfers**: Transfer native assets across different blockchains using Stargate's unified liquidity pools.
- **Deployment Files**: Contains deployment information for each supported chain, including addresses and ABIs of deployed contracts.
- **Comprehensive Utilities**: Provides necessary tools and utilities to interact with Stargate contracts, including error parsing and deployment configurations.

## Installation

To install the Stargate EVM SDK V2 in your project, use npm:

```bash
npm install @stargatefinance/stg-evm-sdk-v2
```
## Usage

Start off by Installing the `node_modules`:

```bash
pnpm install
```

## Building the SDK
To build the SDK, use the provided pnpm script:

```bash
pnpm build
```

This command will compile the TypeScript source files into JavaScript and place them in the dist directory.

### Importing the SDK

To use the SDK, import it into your JavaScript or TypeScript project:

```bash
import { ... } from '@stargatefinance/stg-evm-sdk-v2';
```

## Deployment Information
The SDK includes deployment information for each supported chain, stored in the deployments folder. This folder contains JSON files detailing the deployed contract addresses for various blockchains. For example, to access deployment information for a contract on Arbitrum Mainnet, navigate to `deployments/arbitrum-mainnet/<ContractName>.json`. Here you can view information such as the contract address, ABI, constructor arguments, and other metadata.

## Error Handling
The SDK also provides an `errors.json` file generated during the `build` phase to support parsing and handling errors returned by Stargate contracts.

## To run stargate deployment and configuration checker

1. Add `RPC_URL_MAINNET` to `.env` file and set it to be the LZ proxy RPC URL
2. If adding a new chain to the configuration check, ensure new deployment files for that chain exist in `deployments/`
3. You can run the checker via a single command: `pnpm run validate`

This is what it does under the hood, if you would like to play around with the individual commands:
1. Generate the necessary typechain files by running `pnpm run setup:typechain`
2. Generate the necessary `nativeCurrencyConfigs.json` and `stargatePoolConfig.json` by running `pnpm run config:all`
    - If you prefer to generate these config files individually:
        - Run `pnpm run config:native`
        - Run `pnpm run config:pools:custom -- [options]`
            - Note that this script takes about 10 minutes to finish running.
            - Examples:
              - `pnpm run config:pools:custom -- -e mainnet --numRetries 50`
              - `pnpm run config:pools:custom -- -e testnet --numRetries 20 --verbose`
            - Available flags:
              - `-e <environment>` to indicate environment (mainnet, testnet, etc.)
              - `--verbose` to see the script progress as it runs
              - `--numRetries <number>` to indicate how many times an RPC should be retried if it fails
            - If the file is not updated after running this, it is probably because the `tokenMessagingContract` wasn't updated with the address for the asset.
3. You are now ready to run the checker with `pnpm run check:deployment`
    - One common issue is that the `busMaxNumPassengers * nativeDropAmounts > executor.nativeCap`, which will cause the bus quotes to revert.
    - If you desire to run the above checks for a specific chain or chains, use the `pnpm run check:deployment:custom` command with custom parameters:
        - Examples:
          - `pnpm run check:deployment:custom -e mainnet -t "mantle,hemi"`
          - `pnpm run check:deployment:custom -e testnet --numRetries 30`
          - `pnpm run check:deployment:custom -e mainnet -t "ethereum,arbitrum" --numRetries 20`
        - Available flags:
          - `-e <environment>` to specify environment (mainnet, testnet, etc.)
          - `-t "<chains>"` to target specific chains (comma-separated)
          - `--numRetries <number>` to specify retry attempts for failed RPC calls
    - If you desire to run individual checks, run the following command from the root of this package:
        - `ts-node src/checkDeployment/<name of file>.ts -e mainnet`
        - For example, `ts-node src/checkDeployment/feeConfigsState.ts -e mainnet`
        - The same flags apply to the individual scripts (`-e`, `-t`, `--numRetries`)

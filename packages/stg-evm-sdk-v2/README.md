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
2. Generate typechain
    - Navigate to `src/stargate-contracts` and run `node typechainConfig.js`. Then navigate to `src/protocol-contracts` and run the same command. Then navigate to `src/openzeppelin-contracts` and run the same command.
3. If adding a new chain to the configuration checker:

        a. Ensure new deployment files for that chain exist in `deployments/`
        
        b. Update `stargateV2ChainNamesPerEnvironment` in `src/stargate-contracts/supportedChains.ts` to include the new chain
4. Generate the `nativeCurrencyConfigs.json` by running `ts-node src/generateNativeCurrencyConfig.ts` in the root of this package.
5. Generate the `stargatePoolConfig.json` by running `ts-node src/generatePoolConfig.ts -e mainnet` in the root of this package. 
    - Note that this script takes about 10 minutes to finish running. 
    - Use the `--verbose` flag to see the script progress as it runs.
    - You can also use `--numRetries` to indicate how many times an rpc should be re-tried if it fails before giving up and terminating the script run.
    - If the file is not updated after running this, it is probably because the tokenMessagingContract wasn't updated with the address for the asset.

6. You are now ready to run the checker.
    - To run all checks, run the following command from the root of this package:
        - `ts-node src/checkDeployment/index.ts -e mainnet`
            - One common issue is that the busMaxNumPassengers * nativeDropAmounts > executor.nativeCap, which will cause the bus quotes to revert.
    - To run individual checks, run the following command from the root of this package:
        - `ts-node src/checkDeployment/<name of file>.ts -e mainnet`
        - For example, `ts-node src/checkDeployment/feeConfigsState.ts -e mainnet`
    - To run the above checks for a specific chain or chains, use the `-t` flag
        - For example, `ts-node src/checkDeployment/index.ts -e mainnet -t "mantle,hemi"`
    - Note that similar to the `generatePoolConfig` script, you can use the `--numRetries` flag to indicate how many times an rpc should be re-tried if it failes before giving up and terminating the script run.

// TODO
- TODO clean up TODO comments, like moving things to common-utils
- TODO scour codebase for any unrelated/unneccessary logic
- Compare all config files to offchain
- TODO clean up README to be more clear as to how to run checker and the prep work needed
- Clean up comments
- don't export things that are not used in other files
- Test everything

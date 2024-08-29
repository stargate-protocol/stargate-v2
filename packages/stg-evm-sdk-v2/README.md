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


# Tether Contracts deployed by LayerZero

This package reflects the code within the tether-contracts-evm repository found [here](https://github.com/tetherto/tether-contracts-evm).

## Introduction to Tether repository
The tether-contracts-evm repository is a repository of all of the currently deployed Tether contracts using an upgradeable proxy. Due to historical versioning, there are several streams deployed using different versions of solidity.

### Live versions

Ethereum
- EURT 
- MXNT
- XAUT

Avalanche


Polygon

## Role of this package
To support USDT on Stargate for chains that do not yet have USDT, we must deploy it ourselves using this package. 

### Deployment instructions
1. Run `pnpm install`
2. Ensure the `hardhat.config.js` is updated with the network details you would like to deploy to. See other networks listed for reference.
3. Rename `.env.example` to `.env` and update the `MNEMONIC` with your actual mnemonic
4. Run `pnpm hardhat deploy --network <network name in hardhat.config.js>`. For example, `pnpm hardhat deploy --network sepolia-testnet`

Once successfully deployed, the deployment result, including the address of the `proxy`, `impl`, and `admin`, will be stored under the `.openzeppelin` directory.




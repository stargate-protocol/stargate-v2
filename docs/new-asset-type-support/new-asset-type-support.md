---
owner: Claudia Barcelo (@clauBv23)
reviewed: 2026-09-03
---

# Introduce a new Stargate asset

This document describes the engineering work required to add an asset that is not yet supported by the Stargate
definitions, contracts, deployment scripts, or wiring tools. Complete this work before using the
[protocol deployment process](protocol-deployment.md) to deploy the asset on a chain.

> [!WARNING]
> If the current implementation differs from this procedure, or if any step appears outdated, stop and contact the OApp
> team or [Claudia Barcelo (@clauBv23)](https://github.com/clauBv23) for clarification.

## Process

### 1. Add the asset definition

Update `packages/stg-definitions-v2/src/types.ts`:

- Add the asset to `TokenName`.
- Add it to `RewardTokenName` only if it will be used as a reward token.

Update `packages/stg-definitions-v2/src/constant.ts`:

- Add an `ASSETS` entry with its name, symbol, unique asset ID, shared decimals, local decimals when needed, and networks.
- Add a `REWARDS` entry only if it will be used as a reward token.

Do not reuse an existing asset ID. The networks can remain empty until the first chain deployment is defined.

### 2. Add contract support

Check whether the existing `StargatePool`, `StargatePoolNative`, or `StargateOFT` contract supports the asset. Reuse the
existing contract when possible.

If the token has different mint, burn, ownership, or transfer behavior, add the required asset-specific contracts and
interfaces. Update the contract selection in `packages/stg-evm-v2/ts-src/utils/deploy-asset.ts` when the deployment must
use those contracts.

Add tests for every new contract and token-specific behavior. Complete the required security review and audit before a
production deployment.

### 3. Add the deployment scripts

Add the scripts required for the asset under `packages/stg-evm-v2/deploy/`:

- `001-deploy-asset-<token>.ts` for the Pool, Native Pool, or Hydra/OFT contract.
- `004-deploy-feelib-<token>.ts` for FeeLib V1.
- `000-deploy-token-<token>.ts` only when the Stargate tooling also deploys the underlying token.

Use the existing deployment factories when they support the asset.

### 4. Add the wiring configuration

Add the mainnet files under `packages/stg-evm-v2/devtools/config/mainnet/01/` and the matching testnet files under
`packages/stg-evm-v2/devtools/config/testnet/`:

- `asset.<token>.config.ts` for the Stargate asset paths.
- `feelib-v1.<token>.config.ts` for FeeLib.
- `<token>-token.config.ts` only when the token itself requires configuration or ownership transfer.

Add these files to the relevant targets in the root `Makefile`:

- `configure-testnet` for testnet configuration and ownership transfer.
- `preconfigure-mainnet` for token setup that requires temporary deployer permissions.
- `configure-mainnet` for the asset and FeeLib configuration.
- `transfer-mainnet` for the asset, FeeLib, and token ownership transfers that apply.
- `check-assets` and `check-feelibs` for validation.

### 5. Validate the new asset

Build the repository and run the Stargate EVM tests:

```bash
pnpm build
pnpm --filter @stargatefinance/stg-evm-v2 test
```

Deploy and wire the asset on testnet, then run:

```bash
make check-assets network=testnet
make check-feelibs network=testnet
```

Test transfers in both directions for every supported deployment type. Do not continue to mainnet until the contract,
deployment, wiring, ownership, and transfer tests pass.

### 6. Release and deploy the asset

Add a changeset for every updated package and create a PR containing the definitions, contracts, deployment scripts,
configuration, and tests.

After the packages are published, follow [Stargate protocol deployment](protocol-deployment.md) to add the asset to each
chain.

## References

- [Original adding-new-assets guide](https://github.com/LayerZero-Labs/StargateV2-docs/blob/main/04-adding-new-assets.md)
- [EURC implementation PR](https://github.com/stargate-protocol/stargate-v2/pull/410)
- [Stargate definitions](https://github.com/stargate-protocol/stargate-v2/tree/main/packages/stg-definitions-v2/src)
- [Stargate deployment scripts](https://github.com/stargate-protocol/stargate-v2/tree/main/packages/stg-evm-v2/deploy)
- [Stargate wiring configuration](https://github.com/stargate-protocol/stargate-v2/tree/main/packages/stg-evm-v2/devtools/config/mainnet/01)

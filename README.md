<p align="center">
  <a href="https://stargate.finance">
    <img src="https://stargate.finance/static/og-image.jpg"/>
  </a>
</p>

# stargate-v2

Stargate v2 is an omnichain liquidity transport protocol built on LayerZero. This repository contains the EVM contracts, deployment/configuration tooling, TypeScript SDK packages, generated deployment data, and validation scripts used to build and operate Stargate v2.

For a compact map of the codebase, read `ARCHITECTURE.md`. For coding-agent instructions, read `AGENTS.md`. For unattended Symphony runs, read `WORKFLOW.md`.

## Protocol Concepts

Stargate assets are represented by OFT or Hydra asset implementations on each supported chain. These contracts handle source-chain token movement, fees, rewards, path credit, and delivery into destination-chain assets.

LayerZero message flow is isolated in Stargate OApps:

- `TokenMessaging` sends value-transfer messages. It supports taxi sends for direct delivery and bus sends for batched delivery.
- `CreditMessaging` sends credit-allocation messages. Credit is the per-path send capacity in shared decimals; a send consumes credit so the destination side can honor Stargate's delivery guarantee.

The planner is a trusted liveness and rebalancing role. It can allocate credit, tune bus parameters, pause assets, and adjust pool targets, but it should not have a path to steal user funds.

Hydra lets native assets bridge through Stargate-wrapped OFTs on chains where the native asset is not deployed, then redeem where a native asset pool exists.

JIT liquidity intents coordinate with the planner to move credit where liquidity is needed for swaps and redemptions.

## Repository Map

- `packages/stg-evm-v2` contains Solidity contracts, Hardhat/Foundry config, deployment scripts, tests, deployment data, and operational tasks.
- `packages/stg-definitions-v2` contains shared asset, network, DVN, executor, OneSig, legacy Safe, and messaging definitions.
- `packages/stg-devtools-v2` contains chain-agnostic configuration models and configurators.
- `packages/stg-devtools-evm-hardhat-v2` converts desired configuration into EVM/Hardhat transactions.
- `packages/stg-evm-sdk-v2` contains SDK helpers, TypeChain bindings, deployment checks, and generated config.
- `packages/stg-error-parser` wraps LayerZero error parsing with Stargate's generated error data.

## Setup

```shell
pnpm install
pnpm build
pnpm test
```

Useful package-level commands:

```shell
pnpm --filter @stargatefinance/stg-evm-v2 test:forge
pnpm --filter @stargatefinance/stg-evm-v2 test:hardhat
pnpm --filter @stargatefinance/stg-evm-sdk-v2 validate
```

## Documentation

- `ARCHITECTURE.md` maps packages, protocol boundaries, OApps, credit, deployment/configuration flow, and common change locations.
- `AGENTS.md` is the concise guide for coding agents.
- `WORKFLOW.md` configures the Symphony Linear-to-Codex workflow.
- `skills/` contains shared task workflows referenced by agent-specific wrappers.
- `docs/01-ONBOARDING.md` covers local setup.
- `docs/02-TESTING.md` explains validation choices.
- `docs/03-CONFIGURATION.md` maps configuration source-of-truth paths.
- `docs/04-DEPLOYMENT.md` maps deployment and generated artifacts.
- `docs/05-CHAIN_AND_ASSET_ONBOARDING.md` lists chain and asset onboarding checks.
- `docs/06-SECURITY.md` summarizes trust boundaries and operational risk.
- `docs/07-SYMPHONY.md` explains the local Symphony setup.

## Related LayerZero Contracts

Stargate transactions may interact with LayerZero Value Transfer API contracts, including `LZMultiCall`. For the canonical list and addresses, see the [LayerZero Value Transfer API overview](https://docs.layerzero.network/v2/developers/value-transfer-api/contracts/overview#lzmulticall-wrapper).

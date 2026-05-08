# Architecture

This repository contains Stargate v2's EVM contracts, deployment tooling, generated deployment data, and TypeScript packages used to configure, inspect, and integrate with those contracts.

The most important navigation rule is that runtime protocol behavior starts in `packages/stg-evm-v2/src`. TypeScript packages around it either publish shared constants and schemas, generate or validate deployment state, or expose typed SDK helpers for consumers.

This document is a map, not a full reference. It should stay short and describe stable boundaries. For exact behavior, use symbol search for the names mentioned below.

## System Overview

Stargate v2 moves value between chains through LayerZero messages while preserving chain-local settlement semantics. Each supported asset is represented on each chain by a Stargate OFT or Hydra asset implementation. That implementation handles source-chain token movement, fees, rewards, and path credit before delegating cross-chain delivery to LayerZero messaging contracts.

LayerZero calls contracts that send and receive cross-chain messages Omnichain Applications, or OApps. In this repository, the two Stargate OApps are:

- `TokenMessaging`, which sends value-transfer messages. It supports taxi sends for direct delivery and bus sends for batched delivery.
- `CreditMessaging`, which sends credit-allocation messages. Credit is the maximum amount, in shared decimals, that a Stargate asset can send through a path. It is the on-chain capacity check behind Stargate's delivery guarantee: a source path must have enough credit for the destination amount before a send can proceed, and the send consumes that credit. The planner uses credit messages to rebalance capacity across paths without moving user assets.

The high-level flow for a token transfer is:

1. A user calls `send` or `sendToken` on a Stargate OFT or Hydra asset implementation.
2. The implementation moves source-chain tokens into Stargate accounting. For an OFT, this means burning tokens from the sender; for a pool-backed Hydra asset, this means transferring or accounting for tokens held by the pool. This is token movement, not credit movement.
3. The implementation applies fees or rewards, checks and consumes path credit, and decides taxi vs bus behavior.
4. `TokenMessaging` encodes and sends the LayerZero message.
5. The remote `TokenMessaging` decodes the message and calls the remote Stargate asset implementation.
6. The remote Stargate asset implementation performs outflow to the receiver or records an undelivered token for retry.

## Package Map

`packages/stg-evm-v2` is the core contracts and deployment package. It owns Solidity source, Hardhat and Foundry configuration, deployment scripts, generated ABIs, deployment JSON, localnet support, and operational tasks.

`packages/stg-definitions-v2` contains shared protocol constants and static types: asset IDs, token names, Stargate implementation types, DVNs, executors, LayerZero message library versions, per-network config shapes, OneSig config, and legacy Safe config. Other packages should depend on these definitions instead of duplicating network or asset concepts.

`packages/stg-devtools-v2` contains chain-agnostic configuration models and configurators. Its modules are organized by protocol concern, such as `asset`, `token-messaging`, `credit-messaging`, `feeLib_v1`, `rewarder`, `staking`, `treasurer`, and `oft-wrapper`.

`packages/stg-devtools-evm-hardhat-v2` adapts the devtools models to EVM and Hardhat. It contains SDK classes, factories, schemas, and mixins that turn desired configuration graphs into EVM transactions.

`packages/stg-evm-sdk-v2` is the consumer-facing EVM SDK. It exports TypeChain bindings, deployment helpers, config loaders, generated pool/native-currency config, and deployment validation scripts. The `stargate-sdks` modules provide typed runtime access to deployed contracts.

`packages/stg-error-parser` wraps LayerZero's error parser with Stargate's generated `errors.json`.

## Core Contract Map

`StargateBase` is the shared base for Stargate OFTs and Hydra assets. It owns local token accounting, shared/local decimal conversion, treasury accounting, planner and treasurer permissions, pause/reentrancy state, path credit storage, token send entrypoints, credit send/receive hooks, retryable receive state, and LayerZero-related address configuration.

`StargateOFT`, `StargateOFTAlt`, `StargateOFTUSDC`, `StargateOFTEURC`, and `StargateOFTTIP20` are OFT implementations. They specialize source-chain burn and destination-chain mint behavior, plus chain-specific token behavior.

`StargatePool`, `StargatePoolMigratable`, `StargatePoolNative`, `StargatePoolUSDC`, and `StargatePoolEURC` are pool-backed Hydra asset implementations. They add liquidity-pool behavior, LP token handling, pool token movement, and migration-specific behavior.

`TokenMessaging` is the LayerZero OApp responsible for token messages. It maps asset IDs to Stargate implementations, quotes and sends taxi messages, queues bus passengers, drives buses, handles native drops, and routes received messages back into Stargate asset contracts.

`CreditMessaging` is the LayerZero OApp responsible for credit messages. It asks local Stargate assets which path credit can be moved, encodes the batches, sends them through LayerZero, and routes received credit batches to the matching remote assets.

`MessagingBase` is the shared OApp base for Stargate messaging contracts. It owns common peer and asset routing behavior used by token and credit messaging.

`FeeLibV1` is the fee and reward policy contract used by Stargate assets. Fee configuration belongs outside the asset implementations so fee behavior can be configured independently.

`Bus`, `BusCodec`, `TaxiCodec`, `CreditMsgCodec`, `Path`, `AddressCast`, and `Transfer` are protocol libraries. They hold encoding, queueing, path accounting, address conversion, and safe transfer primitives used by the core contracts.

`Planner`, `Treasurer`, `OFTWrapper`, `StargateMultiRewarder`, `StargateStaking`, `StargateZapperV1`, and `RebateCampaign` are peripheral contracts. They should remain outside the core asset and messaging implementations unless their behavior is part of the transfer or credit protocol itself.

`src/usdc/impl` contains Circle fiat-token compatibility contracts used for USDC/EURC migration and tests. Treat these as compatibility surface, not general Stargate protocol code.

## Deployment And Configuration Map

`packages/stg-evm-v2/deploy` contains Hardhat deployment scripts. Numbered files define deployment ordering for tokens, assets, messaging, fee libraries, staking, rewarders, treasurer, and wrappers.

`packages/stg-evm-v2/hardhat.config.ts` defines networks, named accounts, compiler settings, zksync settings, generated TypeChain output, external v1 deployments, and task loading. Network names are the operational keys used across deployment, config, and validation.

`packages/stg-evm-v2/foundry.toml` configures Forge builds, gas reports, fuzzing, invariants, remappings, and fork RPC aliases.

`packages/stg-evm-v2/devtools/config` contains desired deployed state. Environment directories such as `mainnet`, `testnet`, and `sandbox` compose asset, fee, messaging, reward, staking, treasurer, token, and unwire configs.

`packages/stg-evm-v2/devtools/config/*/chainsConfig` contains per-chain YAML used by config builders. Add chain-level data there when the value is operational configuration rather than Solidity logic.

`packages/stg-evm-v2/devtools/tasks` and `packages/stg-evm-v2/tasks` contain Hardhat tasks for operational actions such as sending, redeeming, balances, snapshots, fee updates, and transaction proposal flows.

`deployments`, `deployments-zk`, `deployed`, `artifacts`, `artifacts-zk`, `out`, `cache`, `dist`, and `ts-src/typechain-types` are generated or build outputs. Do not treat them as the source of architectural intent.

## SDK And Validation Map

`packages/stg-evm-sdk-v2/src/stargate-contracts`, `protocol-contracts`, and `openzeppelin-contracts` expose generated TypeChain bindings and small helpers for deployed contract lookup.

`packages/stg-evm-sdk-v2/src/config` loads deployment and provider configuration. `LocalStargatePoolConfigGetter` and related helpers are the main place to look when code needs pool metadata by environment, chain, or asset.

`packages/stg-evm-sdk-v2/src/stargate-sdks` contains the runtime SDK abstraction. `StargateV2SdkFactory` currently creates EVM SDK instances for every chain; `StargateV2EvmSdk` handles contract metadata, farm metadata, and asset ID discovery.

`packages/stg-evm-sdk-v2/src/checkDeployment` contains deployment-state validation. It checks fee configs, planner permissions, bus native drops, balancing quotes, transfer quotes, planner native balances, and owners.

`packages/stg-evm-sdk-v2/src/generateNativeCurrencyConfig.ts` and `generatePoolConfig.ts` generate SDK config artifacts from deployments and chain state.

## Architectural Invariants

Stargate OFT and Hydra asset implementations do not speak directly to LayerZero endpoints for normal token movement. They call messaging OApps, and messaging OApps call asset handlers on receive.

Token delivery and credit allocation are separate OApp protocols. User value movement belongs in `TokenMessaging`; path capacity changes belong in `CreditMessaging`.

Asset implementations are selected by asset ID in messaging contracts. Adding a new asset requires keeping the asset implementation, asset ID, messaging mappings, devtools config, and deployments consistent.

Path credit is the per-path send capacity and is accounted in shared decimals. Local token movement is accounted in local decimals. Conversions belong at the asset boundary, not in deployment or SDK code.

The planner is trusted for liveness, credit allocation, bus parameters, and pausing, but should not be given a path to steal user funds. The treasurer owns treasury fee operations and token recovery.

Bus behavior is queue-based and destination-specific. Queue capacity, max passengers, fares, and native drops are messaging configuration, not asset implementation details.

Generated TypeChain, deployment exports, artifacts, and build outputs should be regenerated from source and deployment data. Avoid hand-editing generated outputs unless a release process explicitly requires it.

## Cross-Cutting Concerns

LayerZero endpoint IDs are the cross-package chain identity. Prefer `EndpointId` and definitions from `@layerzerolabs/lz-definitions` and `@stargatefinance/stg-definitions-v2` over ad hoc numeric IDs.

LayerZero OApp mechanics are an external boundary. OApps use Endpoint V2 for quoting, sending, receiving, peer management, and message-channel configuration. In Stargate, those mechanics are isolated in `MessagingBase`, `TokenMessaging`, and `CreditMessaging`.

Config flows are graph-based. The devtools packages model nodes and edges, then EVM/Hardhat adapters convert differences between desired and current state into transactions.

OneSig is the current multisig path for new deployments and new chains. Safe config remains only for legacy compatibility with chains that already support it.

Network state is duplicated intentionally at different stages: desired config in `devtools/config`, deployed addresses in `deployments`, exported package data in `deployed` or SDK deployment folders, and generated SDK configs in `src/generated-configs`.

Testing is split by concern. Solidity unit, cross-chain, migration, invariant, and LayerZero helper tests live under `packages/stg-evm-v2/test`; TypeScript devtools and deployment helper tests live beside the package they exercise.

The monorepo build is managed by pnpm and Turbo. Package `build` scripts compile contracts or TypeScript and emit `dist`; root scripts delegate to Turbo.

## Where To Change Things

To change protocol transfer behavior, start in `StargateBase`, the relevant `StargatePool` or `StargateOFT` variant, and the corresponding Solidity tests.

To change token-message encoding, taxi, bus, fares, native drops, or asset routing, start in `TokenMessaging` and the libraries `Bus`, `BusCodec`, and `TaxiCodec`.

To change credit movement or planner credit batching, start in `CreditMessaging`, `CreditMsgCodec`, and the credit hooks on `StargateBase`.

To change fees or rewards for transfers, start in `FeeLibV1`, `IStargateFeeLib`, devtools fee config, and fee-lib tests.

To add or modify a chain, update the Hardhat network definition, definitions constants if needed, `devtools/config` chain data, deployments, and SDK generated config. Then run the deployment checker.

To add or modify an asset, update definitions, Solidity implementation or deployment scripts, asset config, token and credit messaging config, fee config, deployments, SDK generated pool config, and related tests.

To change operational transaction generation, start in `packages/stg-devtools-v2` for desired-state logic and `packages/stg-devtools-evm-hardhat-v2` for EVM transaction construction.

To change consumer SDK behavior, start in `packages/stg-evm-sdk-v2/src/stargate-sdks`, `src/config`, or the generated contract helper modules.

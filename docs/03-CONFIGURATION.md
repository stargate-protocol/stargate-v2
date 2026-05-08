# Configuration

Configuration should be legible, typed where possible, and checked against on-chain state.

## Source Of Truth

- Shared definitions: `packages/stg-definitions-v2/src`
- Desired deployed state: `packages/stg-evm-v2/devtools/config`
- Per-chain YAML: `packages/stg-evm-v2/devtools/config/*/chainsConfig`
- Config models: `packages/stg-devtools-v2/src`
- EVM transaction builders: `packages/stg-devtools-evm-hardhat-v2/src`
- SDK generated config: `packages/stg-evm-sdk-v2/src/generated-configs`

## Rule

Avoid duplicating chain, asset, or messaging constants. Prefer shared definitions and config builders, then regenerate derived outputs.

## Checks

Use package tests for config builders and SDK validation for deployed-state checks.

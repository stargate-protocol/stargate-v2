# Onboarding

Use this file for local setup only. For architecture, read `../ARCHITECTURE.md`.

## Requirements

- Node.js `>=18.12.0`
- pnpm `8.14.0`
- Foundry for Forge tests
- Docker for localnet and snapshot workflows

## First Run

```shell
pnpm install
pnpm build
pnpm test
```

If a package-level command is enough, prefer it over a root command.

## Main Paths

- `packages/stg-evm-v2` for contracts, deployment, and protocol tests.
- `packages/stg-evm-sdk-v2` for SDK config and deployment validation.
- `packages/stg-evm-v2/devtools/config` for desired deployed state.

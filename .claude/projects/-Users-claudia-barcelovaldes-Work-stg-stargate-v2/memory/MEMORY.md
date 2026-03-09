# Stargate V2 Project Memory

## Project Purpose
Monorepo for deploying Stargate V2 (cross-chain liquidity protocol) to new EVM chains.

## Key Packages
- `packages/stg-definitions-v2/src/constant.ts` — DVNs, Executors, Assets, Networks config (3598 lines)
- `packages/stg-evm-v2/hardhat.config.ts` — Hardhat network definitions
- `packages/stg-evm-v2/devtools/config/mainnet/01/chainsConfig/` — per-chain YAML configs
- `packages/stg-evm-v2/deployments/<network>/` — deployment artifacts

## Custom Skills
- `/new-chain` — Guides configuration for a new chain deployment. Located at `.claude/commands/new-chain.md`.

## Deployment Config Pattern
When adding a new chain, 3 files must be updated:
1. `constant.ts` — Add to DVNS.NETHERMIND, DVNS.LZ_LABS, EXECUTORS.LZ_LABS, ASSETS (each token), NETWORKS_CONFIG
2. `hardhat.config.ts` — Add network entry under `// Mainnet` section
3. `chainsConfig/<chain>-mainnet.yml` — Create new YAML from template `0-template-chain.yml`

## Key Addresses Pattern
- NETWORKS_CONFIG uses `DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG` and `DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG` as spread defaults
- nativeDropAmount formula: `gas_price * 500_000 * 3` (18 decimals) — confirm with Angus
- OneSig URL: `${process.env.BASE_ONE_SIG_URL_MAINNET}/<slug>`
- Safe URL: `${process.env.BASE_SAFE_URL_MAINNET}/<slug>`

## Deploy Commands
- `pnpm build` — always build first
- `make deploy-mainnet DEPLOY_ARGS_COMMON="--ci"`
- `make preconfigure-mainnet CONFIGURE_ARGS_COMMON=--ci`
- `make transfer-mainnet CONFIGURE_ARGS_COMMON=--ci`
- `make configure-mainnet CONFIGURE_ARGS_COMMON="--ci --dry-run"` (dry run)
- `make configure-mainnet CONFIGURE_ARGS_COMMON="--onesig"` (multisig)

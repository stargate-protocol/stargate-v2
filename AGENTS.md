# Agent Guide

This is the short entry point for coding agents working in this repository. Keep it concise and treat it as a map to the repo, not an encyclopedia. Put durable architecture knowledge in `ARCHITECTURE.md`; put workflow details in focused files under `docs/`; put task-specific decisions in code, tests, or a short document near the affected subsystem.

## Operating Model

Humans steer; agents execute. Before editing, understand the requested outcome, inspect the relevant code, and identify the smallest coherent change that satisfies the task.

Repository-local knowledge is the source of truth. If a rule, decision, workflow, or invariant is needed for future agent runs, encode it in this repository as documentation, tests, scripts, schemas, or lints.

Prefer feedback loops over guesses. Use the package's existing build, test, lint, deployment-check, and formatting commands to validate work. If a check cannot run, record the reason in the final response.

Preserve user work. The worktree may be dirty. Do not revert, overwrite, or clean unrelated files unless the user explicitly asks.

## Where To Start

Read `README.md` for the product overview and setup commands.

Read `ARCHITECTURE.md` for the protocol map, package boundaries, OApp flow, credit model, deployment/configuration map, and where to change common behavior.

Use `docs/` for narrow workflow maps:

- `docs/01-ONBOARDING.md` for local setup.
- `docs/02-TESTING.md` for validation choices.
- `docs/03-CONFIGURATION.md` for config source-of-truth paths.
- `docs/04-DEPLOYMENT.md` for deployment and generated artifacts.
- `docs/05-CHAIN_AND_ASSET_ONBOARDING.md` for chain/asset checklists.
- `docs/06-SECURITY.md` for trust boundaries and operational risk.
- `docs/07-SYMPHONY.md` for the unattended Linear-to-Codex workflow.

Symphony uses `WORKFLOW.md` as its repo-local workflow contract.

Shared task workflows live under `skills/`. Codex does not load them as native skills automatically; when a task matches one, read the relevant `skills/*/SKILL.md` as repo-local task guidance unless a Codex-native skill exists.

Claude-specific skill wrappers live under `.claude/skills` and should point back to `skills/` rather than duplicating the full workflow.

Use package-local files as the deeper source of truth:

- `packages/stg-evm-v2/src` for Solidity protocol behavior.
- `packages/stg-evm-v2/test` for Solidity unit, cross-chain, migration, invariant, and LayerZero tests.
- `packages/stg-evm-v2/devtools/config` for desired deployed state by environment.
- `packages/stg-definitions-v2/src` for shared asset, network, DVN, executor, OneSig, and legacy Safe definitions.
- `packages/stg-devtools-v2/src` for chain-agnostic config models and configurators.
- `packages/stg-devtools-evm-hardhat-v2/src` for EVM/Hardhat transaction construction.
- `packages/stg-evm-sdk-v2/src` for SDK helpers, deployment checks, generated config, and TypeChain-facing utilities.
- `packages/stg-error-parser/src` for Stargate error parsing.

## Boundaries

For transfer behavior, start in `StargateBase` and the relevant OFT or Hydra asset implementation. Do not push core protocol behavior into deployment scripts or SDK helpers.

For LayerZero OApp behavior, start in `MessagingBase`, `TokenMessaging`, and `CreditMessaging`.

For path capacity, remember that credit is the maximum amount, in shared decimals, that a Stargate asset can send through a path. Sends consume credit; planner-driven credit messages rebalance path capacity.

For configuration transactions, keep desired-state logic in `stg-devtools-v2` and EVM transaction construction in `stg-devtools-evm-hardhat-v2`.

For new deployments and new chains, use OneSig. Safe multisig support is legacy compatibility for chains that already have it; do not add new `safeConfig` entries unless a user explicitly asks for a legacy chain.

Treat generated outputs as generated: `dist`, `out`, `cache`, `artifacts`, `artifacts-zk`, `deployed`, `deployments`, `deployments-zk`, and `ts-src/typechain-types` should be regenerated through the established package scripts rather than hand-edited unless a release process requires it.

## Workflow

1. Inspect current status with `git status --short`.
2. Read the smallest set of files needed to understand the task.
3. Make focused edits that follow existing patterns.
4. Run targeted checks first, then broader checks when the blast radius warrants it.
5. Report changed files, checks run, and any residual risk.

When a task reveals missing context, improve the harness: update `ARCHITECTURE.md`, this file, `docs/`, package docs, tests, scripts, or validation tooling so the next agent does not need the same clarification.

## Commands

Root scripts:

- `pnpm install`
- `pnpm build`
- `pnpm test`
- `pnpm lint`
- `pnpm clean`

Core EVM package:

- `pnpm --filter @stargatefinance/stg-evm-v2 compile`
- `pnpm --filter @stargatefinance/stg-evm-v2 test`
- `pnpm --filter @stargatefinance/stg-evm-v2 test:forge`
- `pnpm --filter @stargatefinance/stg-evm-v2 test:hardhat`
- `pnpm --filter @stargatefinance/stg-evm-v2 lint`

SDK validation:

- `pnpm --filter @stargatefinance/stg-evm-sdk-v2 validate`
- `pnpm --filter @stargatefinance/stg-evm-sdk-v2 check:deployment`

Run narrower package checks when possible. Use full root checks when changing shared definitions, package exports, generated config, or cross-package contracts.

## Style And Quality

Follow existing local patterns before introducing abstractions. Add an abstraction only when it removes real duplication or encodes a stable boundary.

Use structured parsers, schemas, and typed helpers for structured data. Avoid building behavior on guessed JSON/YAML/string shapes.

Keep Solidity changes close to the protocol surface they affect and cover them with targeted tests. For shared protocol behavior, prefer tests that exercise both happy paths and invariant-preserving failure paths.

Keep TypeScript changes type-safe, package-local, and aligned with existing `config`, `schema`, `types`, `factory`, and `sdk` module conventions.

When recurring mistakes appear, prefer a mechanical guardrail: a test, lint, schema, script, generated check, or doc pointer with a clear remediation path.

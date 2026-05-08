# Deployment

This is a map of deployment sources and generated outputs. Keep detailed runbooks close to the task or script that owns them.

## Source Paths

- `packages/stg-evm-v2/deploy` contains ordered Hardhat deploy scripts.
- `packages/stg-evm-v2/hardhat.config.ts` defines networks, named accounts, compilers, zksync settings, and task loading.
- `packages/stg-evm-v2/devtools/config` defines desired post-deploy configuration.
- `packages/stg-definitions-v2/src` defines shared chain, asset, DVN, executor, OneSig, and legacy Safe constants.

## Generated Outputs

- `packages/stg-evm-v2/deployments`
- `packages/stg-evm-v2/deployments-zk`
- `packages/stg-evm-v2/deployed`
- `packages/stg-evm-v2/artifacts`
- `packages/stg-evm-v2/artifacts-zk`
- `packages/stg-evm-v2/out`
- `packages/stg-evm-v2/ts-src/typechain-types`

Do not hand-edit generated outputs unless the release process explicitly requires it.

## Multisig

Use OneSig for new deployments and new chains. Safe config is deprecated for new work and remains only for existing chains that already support it.

## Validation

```shell
pnpm --filter @stargatefinance/stg-evm-sdk-v2 check:deployment
pnpm --filter @stargatefinance/stg-evm-sdk-v2 validate
```

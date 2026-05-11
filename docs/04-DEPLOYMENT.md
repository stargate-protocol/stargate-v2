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
pnpm --filter @stargatefinance/stg-definitions-v2 build
pnpm --filter @stargatefinance/stg-devtools-v2 build
pnpm --filter @stargatefinance/stg-devtools-evm-hardhat-v2 build
pnpm --filter @stargatefinance/stg-evm-sdk-v2 validate
```

After `validate` has restored generated config in the workspace, `pnpm --filter @stargatefinance/stg-evm-sdk-v2 check:deployment` can be used for a narrow rerun.

## Contract Verification

After a human deploys contracts, verify deployment outputs and explorer metadata before wiring or ownership transfer:

```shell
cd packages/stg-evm-v2
npx @layerzerolabs/verify-contract --network <chain-name> --api-url <explorer-api-url>
```

Use an explicit explorer API URL when available. If it is missing, derive it from Chainlist or LayerZero metadata only when the endpoint is obvious, such as a Blockscout-compatible explorer URL plus `/api`. Treat explorer UI URLs like `/home` as hints, not as API URLs.

`preconfigure`, `configure`, wiring, and ownership-transfer commands send transactions. Keep them human-run unless a dedicated deploy workflow explicitly allows them.

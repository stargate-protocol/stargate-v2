# Chain And Asset Onboarding

Use this as a checklist. The exact files depend on the environment and asset.

## Chain

- Add or verify the Hardhat network in `packages/stg-evm-v2/hardhat.config.ts`.
- Add shared chain constants in `packages/stg-definitions-v2/src` when needed.
- Add chain config under `packages/stg-evm-v2/devtools/config/*/chainsConfig`.
- Add OneSig configuration.
- Do not add Safe config for new chains. Safe is legacy compatibility for chains that already support it.
- Generate or update deployments and SDK config.
- Run deployment validation for the target environment.

## Asset

- Add or verify the asset definition and asset ID.
- Add or update the Solidity implementation or deployment script.
- Add asset, fee, token-messaging, and credit-messaging config.
- Update generated pool config and deployment exports.
- Add targeted tests for the asset path, including credit behavior.

## Rule

Every chain or asset change must keep definitions, config, deployments, SDK generated data, and validation checks aligned.

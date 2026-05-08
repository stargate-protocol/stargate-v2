# Testing

Run the smallest check that proves the change, then broaden only when the change crosses package or protocol boundaries.

## Common Checks

```shell
pnpm --filter @stargatefinance/stg-evm-v2 test:forge
pnpm --filter @stargatefinance/stg-evm-v2 test:hardhat
pnpm --filter @stargatefinance/stg-evm-v2 lint
pnpm --filter @stargatefinance/stg-evm-sdk-v2 validate
pnpm test
```

## Choosing A Check

- Solidity protocol changes: run the relevant Forge or Hardhat tests in `packages/stg-evm-v2/test`.
- Messaging, bus, credit, or fee changes: include tests around `TokenMessaging`, `CreditMessaging`, `StargateBase`, and `FeeLibV1`.
- Devtools transaction changes: run the relevant Hardhat/devtools tests from `packages/stg-evm-v2/test/devtools`.
- SDK config or deployment-check changes: run SDK validation or the narrow checker.

If a check depends on RPC credentials or external state, say so in the final response.

# Stargate Planner Deprecation Runbook

Reference:
[PLANNER_DEPRECATION.md](https://github.com/LayerZero-Labs/monorepo-internal/blob/4630b39de4cd0a4c2dd06b579040b34156b79ae9/legacy/offchain-monorepo/apps/stargate/docs/PLANNER_DEPRECATION.md)

This runbook documents the operational process for deprecating Stargate planner
participation for a full chain or for selected assets on a chain. It covers the
planner config changes, credit draining, pool config regeneration, chain status
updates, and runtime checks involved in the deprecation.

It covers two cases:

- Full chain deprecation: the chain should stop participating in Stargate V2
  planner for every asset. Examples: `codex`, `glue`.
- Asset-only deprecation: only some assets should stop participating on a
  chain, while other assets on that chain remain active. Example: deprecating
  `USDC` and `USDT` on `sei` while keeping `ETH` active.

Run all commands from the repository root:

```bash
cd monorepo-internal
```

## Key Files

| Purpose                                         | File                                                                                                                                                             |
| :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weighting and credit distribution source config | `legacy/offchain-monorepo/apps/stargate/server/src/packages/static-config/staticDynamicConfigs/stargatePlannerConfig/assetBasedConfigs.ts`                       |
| Generated planner config                        | `legacy/offchain-monorepo/apps/stargate/server/src/packages/static-config/staticDynamicConfigs/configs/stargatePlannerConfig/mainnet/stargatePlannerConfig.json` |
| Stargate V2 supported/deprecated chain status   | `legacy/offchain-monorepo/packages/contracts/stargate-v2/src/supportedChains.ts`                                                                                 |
| Generated pool config                           | `legacy/offchain-monorepo/apps/stargate/server/src/packages/dynamic-config/configs/stargatePoolConfig/mainnet/stargatePoolConfig.json`                           |
| Pool config generator                           | `legacy/offchain-monorepo/apps/stargate/scripts/src/generatePoolConfig.ts`                                                                                       |
| Planner config generator                        | `legacy/offchain-monorepo/apps/stargate/scripts/src/generateStaticDynamicConfigs.ts`                                                                             |
| Manual credit drain script                      | `legacy/offchain-monorepo/apps/stargate/scripts/src/depleteCreditsForDeprecatedChains.ts`                                                                        |
| Credits state checker                           | `legacy/offchain-monorepo/apps/stargate/scripts/src/checkDeployment/creditsState.ts`                                                                             |

## Important Concepts

Planner config changes do not move credits by themselves. They only change the
target weights. The weighting workflow must run, the balancing workflow must
submit credit transfers, and the cross-chain messages must settle.

For pool chains, setting only `maximumWeights[chain] = 0` is not enough if the
chain can still inherit `defaultMinimalWeight`. The minimum can override the
maximum. Set both:

```ts
minimalWeights: {
    targetChain: 0,
},
maximumWeights: {
    targetChain: 0,
},
```

In `creditsState.ts` output, the value `18446744073709551615` is `uint64.max`.
For OFT paths this is an infinite/sentinel value, not a finite credit balance to
drain. Focus on finite non-zero values.

## Pre-Check: Identify Assets on the Chain

Use this to see which Stargate V2 assets exist for a chain and whether they are
`POOL`, `NATIVE`, or `OFT`.

```bash
CHAIN=glue \
node -e 'const fs=require("fs"); const chain=process.env.CHAIN; const p="legacy/offchain-monorepo/apps/stargate/server/src/packages/dynamic-config/configs/stargatePoolConfig/mainnet/stargatePoolConfig.json"; const cfg=JSON.parse(fs.readFileSync(p,"utf8")).v2; for (const [assetId,pool] of Object.entries(cfg)) { const info=pool.poolInfo[chain]; if (info) console.log(assetId, info.stargateType, info.token?.symbol || pool.symbol || ""); }'
```

## Phase 1: Drain Credits From Deprecated Paths

This phase stops the planner from allocating new credits to the chain or asset
paths being deprecated, then verifies that finite credits have drained. Keep all
source config edits, generated JSON, deploy/wait steps, and credit checks in
this phase.

Update:

```text
legacy/offchain-monorepo/apps/stargate/server/src/packages/static-config/staticDynamicConfigs/stargatePlannerConfig/assetBasedConfigs.ts
```

### Full Chain Credit Drain

For a full chain deprecation, update the default weighting config so every asset
gets a zero floor and zero ceiling for the target chain.

Pattern:

```ts
const defaultWeightingConfig: WeightingConfig = {
    // ...
    minimalWeights: {
        glue: 0,
        // other deprecated chains
    },
    maximumWeights: {
        plume: 0,
        xchain: 0,
        cronoszkevm: 0,
        codex: 0,
        glue: 0,
        // other deprecated chains
    },
    // ...
}
```

This prevents the planner from allocating new target credits to the chain for
every asset.

### Asset-Only Credit Drain

For asset-only deprecation, do not change defaults for the whole chain. Scope the
zero-credit weights to only the assets being deprecated.

Example: if only asset `1` and asset `2` are being deprecated on `sei`, keep any
other `sei` assets, such as `ETH`, outside this change.

Use the existing `assetBasedConfigs.ts` structure and add overrides only under
the relevant asset IDs. The credit-drain change should set both the target
chain's minimum and maximum weights to `0`. Setting only the maximum to `0` is
not enough if the target chain can still inherit a positive minimum.

Example pattern for draining credits from asset `1` and asset `2` on Sei:

```ts
export const assetDefaultOverrides: DeepOptional<{
    [assetId: string]: {
        weighting: WeightingConfig
        balancing: BalancingConfig
        feeLib: FeeLibConfig
    }
}> = {
    '1': {
        weighting: {
            minimalWeights: {
                sei: 0,
            },
            maximumWeights: {
                sei: 0,
            },
        },
    },
    '2': {
        weighting: {
            minimalWeights: {
                sei: 0,
            },
            maximumWeights: {
                sei: 0,
            },
        },
    },
}
```

This prevents the planner from allocating new target credits to Sei for only
those assets. It does not remove Sei from every asset and does not move credits
by itself.

### Optional Pool Drain Path

If the asset is a pool and the team wants to drain liquidity through one
specific outbound path, add a source-chain override for the deprecated chain and
asset. This keeps one drain path active while setting all other weighting
defaults to `0`.

This is not the same as zeroing credits to the deprecated chain. It keeps one
path active so operators can drain the pool through that path. The exact
`drainChain` should be chosen based on the path the team will use to exit the
pool.

Example pattern used for Sei assets routed through BNB Chain:

```ts
export const baseConfigs: DeepOptional<PlannerAssetBasedConfig> = {
    '1': {
        sei: {
            weighting: {
                localWeight: 0,
                defaultMinimalWeight: 0,
                minimalWeights: {
                    bsc: 100_000_000, // 100 % to bsc -> sei path
                },
                defaultMaximumWeight: 0,
                maximumWeights: {
                    bsc: 100_000_000,
                },
                defaultBaseWeight: 0,
                baseWeights: {
                    bsc: 100_000_000,
                },
            },
        },
    },
    '2': {
        sei: {
            weighting: {
                localWeight: 0,
                defaultMinimalWeight: 0,
                minimalWeights: {
                    bsc: 100_000_000,
                },
                defaultMaximumWeight: 0,
                maximumWeights: {
                    bsc: 100_000_000,
                },
                defaultBaseWeight: 0,
                baseWeights: {
                    bsc: 100_000_000,
                },
            },
        },
    },
}
```

### Regenerate Planner Config

After changing `assetBasedConfigs.ts`, regenerate the static dynamic config.

```bash
pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
./src/generateStaticDynamicConfigs.ts -e mainnet
```

This updates:

```text
legacy/offchain-monorepo/apps/stargate/server/src/packages/static-config/staticDynamicConfigs/configs/stargatePlannerConfig/mainnet/stargatePlannerConfig.json
```

Open the credit-drain PR with:

- the source config change in `assetBasedConfigs.ts`
- the generated `stargatePlannerConfig.json`

After merge/deploy, the weighting and balancing workflows must run before
credits actually move on-chain.

### Check Credits

Check all current credit paths involving the target chain:

```bash
pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
./src/checkDeployment/creditsState.ts -e mainnet -t glue
```

Interpretation:

- `0` means no finite credits on that path.
- `18446744073709551615` is `uint64.max`; for OFT paths this is an infinite
  sentinel and should not be treated as remaining finite credits.
- Any other finite non-zero value is still a credit amount to drain or wait for.

### Manually Drain Remaining Credits

Use the manual drain script when finite credits are still held on the chain being
deprecated.

File:

```text
legacy/offchain-monorepo/apps/stargate/scripts/src/depleteCreditsForDeprecatedChains.ts
```

The script has default chain and asset filters:

```ts
const defaultChainsToDeprecate = ['xchain', 'plume', 'codex', 'cronoszkevm', 'sei', 'swell']
const defaultAssetIdsToDeprecateByChain: Partial<Record<string, string[]>> = {
    sei: ['1', '2'],
}
```

Override the defaults with `--chains`/`-c` and, for asset-scoped drains,
`--assetIds`/`-a`. Both flags accept comma-separated values.

For full-chain deprecation, target the chain explicitly.

Dry-run:

```bash
pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
./src/depleteCreditsForDeprecatedChains.ts --chains glue
```

Execute:

```bash
pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
./src/depleteCreditsForDeprecatedChains.ts --chains glue --execute true
```

For multiple full-chain drains, pass a comma-separated list:

```bash
pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
./src/depleteCreditsForDeprecatedChains.ts --chains glue,swell --execute true
```

For asset-only deprecation, do not run an unscoped full-chain drain if other
assets must remain active. Pass both the chain and asset IDs.

Dry-run:

```bash
pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
./src/depleteCreditsForDeprecatedChains.ts --chains sei --assetIds 1,2
```

Execute:

```bash
pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
./src/depleteCreditsForDeprecatedChains.ts --chains sei --assetIds 1,2 --execute true
```

Run the credits state check again after jobs are delivered. Repeat until the
dry-run says it will execute `0` jobs and the credits state has no finite
non-zero values for the target paths.

## Phase 2: Finalize Deprecation

Start this phase only after Phase 1 shows no finite credits remain for the
target chain or asset paths and the relevant chain or assets have been unwired
in the Stargate protocol. Choose the full-chain or asset-only path below based
on the deprecation scope.

### Full Chain Finalization

Use this when every asset on a chain should be removed from Stargate V2 planner.

Steps:

1. Set the chain to `ChainStatus.DEPRECATED`.

    File:

    ```text
    legacy/offchain-monorepo/packages/contracts/stargate-v2/src/supportedChains.ts
    ```

    Pattern:

    ```ts
    glue: ChainStatus.DEPRECATED,
    ```

2. Regenerate pool config.

    ```bash
    pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
    ./src/generatePoolConfig.ts -e mainnet
    ```

    Expected change: the full chain should be removed from
    `stargatePoolConfig.v2.*.poolInfo` for every asset.

3. Regenerate planner config.

    ```bash
    pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
    ./src/generateStaticDynamicConfigs.ts -e mainnet
    ```

    Expected change: the full chain should be removed from
    `chainBasedConfigs` and from every generated `assetBasedConfigs` asset
    entry.

4. Open a PR with `supportedChains.ts`, generated `stargatePoolConfig.json`,
   and generated `stargatePlannerConfig.json`.

5. After merge, deploy/restart Stargate planner so runtime workers load the new
   config.

### Asset-Only Finalization

Use this when the chain stays active for other assets.

Steps:

1. Confirm only the deprecated assets have been unwired from the Stargate
   protocol so `TokenMessaging` no longer reports them as linked for the chain.
   Do not set the whole chain to `ChainStatus.DEPRECATED`.

2. Regenerate pool config.

    Active assets per chain are read from `TokenMessaging.stargateImpls(assetId)`.
    `stargatePoolConfig.json` is generated from that protocol state, so assets
    correctly unwired in the protocol should disappear from the generated pool
    config.

    ```bash
    pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
    ./src/generatePoolConfig.ts -e mainnet
    ```

    Expected change: the deprecated asset IDs should be removed from
    `stargatePoolConfig.v2.<assetId>.poolInfo.<chain>`, while assets kept active
    on that chain should still remain.

3. Regenerate planner config.

    ```bash
    pnpm --filter @offchain-monorepo/stargate-scripts exec tsx \
    ./src/generateStaticDynamicConfigs.ts -e mainnet
    ```

    Expected change: the planner config is refreshed after the pool config
    change. Do not use generated `assetBasedConfigs.<assetId>.<chain>` entries
    as proof that an asset is supported on a chain; asset support is determined
    from `stargatePoolConfig.v2.<assetId>.poolInfo.<chain>`.

4. Open a PR with generated `stargatePoolConfig.json` and generated
   `stargatePlannerConfig.json`.

5. After merge, deploy/restart Stargate planner so runtime workers load the new
   config.

### Post-Merge Confirmation

Use this after the final PR is merged into your branch or `main`, deployed, and
planner workflows have been restarted.

Use this command to verify which assets still appear for a chain in the generated
pool config:

```bash
CHAIN=sei \
node -e 'const fs=require("fs"); const chain=process.env.CHAIN; const p="legacy/offchain-monorepo/apps/stargate/server/src/packages/dynamic-config/configs/stargatePoolConfig/mainnet/stargatePoolConfig.json"; const cfg=JSON.parse(fs.readFileSync(p,"utf8")).v2; const assets=Object.entries(cfg).filter(([,pool])=>pool.poolInfo[chain]).map(([assetId,pool])=>({assetId,type:pool.poolInfo[chain].stargateType,symbol:pool.poolInfo[chain].token?.symbol||pool.symbol})); console.log(assets);'
```

For full-chain deprecation, this should return an empty list for the deprecated
chain. For asset-only deprecation, the deprecated asset IDs should not appear in
the list, while assets intentionally kept active on the chain may still appear.

To confirm runtime, check
`http://localhost:3000/stargate_mainnet/workflows?wfType=stargateV2BusFareJobWorkflow`.
Current/new workflow runs should not include any deprecated chain or deprecated
chain/asset paths. Ignore historical runs from before the deploy.

## Final Checklist

Full chain deprecation:

1. Identify chain assets and pool types.
2. In Phase 1, add the chain to zero weight defaults in `assetBasedConfigs.ts`.
3. Optionally configure a single pool drain path if liquidity must exit through one route.
4. Regenerate `stargatePlannerConfig.json`, then merge/deploy the credit-drain PR.
5. Wait for weighting and balancing to move credits.
6. Check credits and run `depleteCreditsForDeprecatedChains.ts` until no finite credits remain.
7. Confirm the relevant Stargate protocol wiring has been removed.
8. In Phase 2, set the chain to `ChainStatus.DEPRECATED`.
9. Regenerate `stargatePoolConfig.json` and `stargatePlannerConfig.json`.
10. Merge/deploy and restart planner.
11. Confirm local generated config and Truesight runtime.

Asset-only deprecation:

1. Identify asset IDs to deprecate and assets to keep.
2. In Phase 1, scope zero/consolidation weights to only those asset IDs.
3. Optionally configure a single pool drain path if liquidity must exit through one route.
4. Regenerate `stargatePlannerConfig.json`, then merge/deploy the credit-drain PR.
5. Wait for weighting and balancing to move credits.
6. Check credits and drain finite credits with the target chain and asset ID filters.
7. Confirm only those assets have been unwired from Stargate protocol / `TokenMessaging`.
8. In Phase 2, regenerate `stargatePoolConfig.json` and `stargatePlannerConfig.json`.
9. Merge/deploy and restart planner.
10. Confirm local generated config and Truesight runtime.

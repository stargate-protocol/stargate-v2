# Stargate Chain Deprecation

This guide explains how to deprecate a Stargate V2 chain or a subset of assets
on a chain. It is the entry point for BD, product, and developers.

Use this file to understand the full process and track the work. Use the focused
guides for execution details:

- [Protocol unwiring](./protocol-unwiring.md)
- [Planner deprecation](./planner-deprecation.md)
- Coordination source:
  [chain and asset deprecation gist](https://gist.github.com/clauBv23/7ee7fe91496f398e68a1b2ff242264ab)
- Source planner runbook:
  [PLANNER_DEPRECATION.md](https://github.com/LayerZero-Labs/monorepo-internal/blob/4630b39de4cd0a4c2dd06b579040b34156b79ae9/legacy/offchain-monorepo/apps/stargate/docs/PLANNER_DEPRECATION.md)

The process has three workstreams:

1. Coordinate the deprecation scope, communications, owner, deadlines, and user
   impact.
2. Drain planner credit allocation and remove deprecated paths from planner
   runtime.
3. Unwire protocol paths after funds, credits, in-flight messages, and user exit
   requirements are handled.

Deprecation is complete only when every deployed Stargate V2 asset and USDT0.s
on the chain has either been handled or explicitly marked out of scope.

## Current Asset Footprint

For a full chain deprecation, check every Stargate V2 asset:

- USDC
- USDT
- EURC
- ETH/WETH

Also check the separate USDT0.s mesh.

If an asset or USDT0.s is not deployed on the chain, mark it as `N/A` in the
decision record. If it is deployed, include it in scope or record why it is out
of scope, who owns the follow-up, and when it will be handled.

## Decision Record

Create this before implementation starts. Keep it updated until final evidence
is linked.

| Field | Required value |
| :-- | :-- |
| Chain | Canonical chain name, EID, environment |
| Scope | Full chain or asset-only |
| Stargate V2 assets to deprecate | Asset symbols: USDC, USDT, EURC, ETH/WETH |
| Stargate V2 assets to keep | Asset symbols, or `none` |
| USDT0.s scope | `included`, `not deployed`, or `out of scope` |
| Asset type | Pool, native pool, Hydra/OFT, or mixed |
| User impact | LPs for pool assets, users/holders for Hydra/OFT assets, or `N/A` |
| Communications owner | Owner for LP, user, or holder notices, or `N/A` |
| Planner owner | Owner for credit drain and backend/planner deprecation |
| Protocol owner | Owner for protocol unwiring and disconnected checks |
| Pool drain / treasury fee owner | Owner for pool drain and treasury fees, or `N/A` |
| Route freeze time | When new inbound activity should be disabled |
| Withdrawal / final disconnect deadline | Last expected user or LP exit time before final disconnect |
| Pool dust threshold | Approved threshold for pool balance and LP supply |
| Credit dust threshold | Approved threshold for finite planner credits |
| Final evidence | Links to PRs, dry-runs, transactions, checks, deploys, and announcements |

## Classify The Deprecation

Full chain deprecation removes the chain from Stargate V2 for every in-scope
asset. It needs planner full-chain deprecation and protocol messaging unwire.

Asset-only deprecation removes selected assets while the chain stays live for
other assets. Planner changes must be scoped to the deprecated asset IDs, and
protocol unwiring must not remove chain-level messaging, Hardhat, Safe, OneSig,
or deployment config.

Pool or native pool assets have local liquidity and LP tokens. LPs must be able
to redeem before protocol paths are disconnected. Pool balance, LP supply,
treasury fees, and finite planner credits must be drained or accepted as dust.

This "LPs redeem first" requirement could be removed by keeping total pool
liquidity synchronized with LP token supply, which would let LPs redeem even
after paths are disconnected. This matters mainly if a chain has LPs that fail to
withdraw in time; it is an unlikely case since we control most LP, but worth
noting.

Hydra/OFT assets are user-held supply. Users need time and active outbound paths
to leave. Disable new inbound routes first, keep outbound exit paths available
through the withdrawal window, and fully disconnect only after the deadline or an
approved supply threshold is reached.

Mixed chains need both flows. Drain pool assets first. After pool assets are safe,
use the Hydra/OFT inbound-first flow and preserve user exits until final
disconnect is allowed.

## End-To-End Flow

### 1. Confirm Scope

Decide whether the work is full-chain or asset-only.

For full-chain deprecation:

1. Check USDC, USDT, EURC, ETH/WETH, and USDT0.s.
2. Classify each deployed asset as pool, native pool, Hydra/OFT, or mixed.
3. Assign owners for communications, planner, protocol, pool drain, and USDT0.s.

For asset-only deprecation:

1. List the assets being removed.
2. List the assets intentionally staying live.
3. Confirm the chain itself is not being marked deprecated.
4. Confirm planner and protocol work will be scoped to only the deprecated
   assets.

### 2. Notify Impacted Parties

Send notices as soon as deprecation is approved.

For pool assets:

- Notify LPs to redeem LP tokens.
- Share the expected pool drain window and final disconnect deadline.
- Assign the treasury fee withdrawal owner and confirm when fees are withdrawn
  or explicitly accounted for.

For Hydra/OFT assets:

- Notify users and holders to withdraw.
- Publish the withdrawal deadline and supported exit routes.
- Explain that Stargate exit paths will not be available after final disconnect.

### 3. Stop New Activity Safely

Pool assets may keep one intended drain path active if the team needs it to
drain local liquidity. Do not fully disconnect pool paths until pool balance,
LP supply, treasury fees, and finite credits are handled.

Hydra/OFT assets should stop new inbound activity first while keeping outbound
exits available. Do not remove the reverse path users need to leave before the
withdrawal deadline.

### 4. Drain Planner Credit Allocation

Follow [planner deprecation](./planner-deprecation.md).

Important checks:

- Planner scope matches the decision record.
- Full-chain deprecation covers every in-scope Stargate V2 asset.
- Asset-only deprecation changes only the deprecated asset IDs.
- Both `minimalWeights` and `maximumWeights` are set to `0` where credits must
  drain.
- `18446744073709551615` / `uint64.max` on OFT paths is treated as an infinite
  sentinel, not finite credit to drain.
- Runtime workflows are restarted or redeployed after final planner removal.

### 5. Drain Pools Or Wait For User Withdrawals

Pool assets can proceed to final protocol unwiring only when:

- LPs were notified.
- LP token supply is zero or within the approved threshold.
- Pool balance is zero or within the approved threshold.
- Treasury fees are handled where applicable.
- Finite planner credits are zero or within the approved threshold.

Hydra/OFT assets can proceed to final protocol unwiring only when:

- Users and holders were notified.
- Inbound routes were disabled.
- Outbound exit routes stayed available through the withdrawal window.
- User-held supply is zero, within the approved threshold, or the deadline has
  passed.
- Finite planner credits are zero or within the approved threshold.

### 6. Unwire Protocol Paths

Follow [protocol unwiring](./protocol-unwiring.md).

Important checks:

- Protocol scope matches the decision record.
- Dry-run output is reviewed before any transaction is proposed.
- Asset-only unwire does not remove chain-level config.
- Pool-chain messaging unwire waits for pool and credit drain.
- Hydra/OFT final disconnect waits for user exit requirements.
- The disconnected checker passes before active chain config is removed for a
  full chain deprecation.

### 7. Deprecate Backend And Planner Runtime

After protocol state and generated pool config reflect the intended removal,
finish planner/backend deprecation:

- Full chain: mark the chain `ChainStatus.DEPRECATED`, regenerate planner
  config, merge, deploy, and restart workflows.
- Asset-only: regenerate pool config after protocol unwiring, regenerate planner
  config, merge, deploy, and verify kept assets still appear.

Local generated JSON is not enough. Confirm the latest runtime workflows no
longer include the deprecated chain or asset paths.

### 8. Handle USDT0.s

For full chain deprecation, USDT0.s must be checked explicitly.

If USDT0.s is deployed and in scope, coordinate shutdown with the owning team,
notify users and holders, and use the same inbound-first, exit-preserving
approach as Hydra/OFT assets.

If USDT0.s is not in scope, record the reason, owner, and follow-up deadline in
the decision record.

## Operator Checklist

Full chain deprecation:

1. Decision record created.
2. Scope confirmed for USDC, USDT, EURC, ETH/WETH, and USDT0.s; every deployed
   asset is included or explicitly out of scope.
3. Asset type and user impact are classified.
4. Communications sent.
5. Route freeze time recorded.
6. Withdrawal / final disconnect deadline recorded.
7. Planner credit allocation drained.
8. Finite planner credits drained or accepted as dust.
9. Pool balances, LP supply, and treasury fees handled.
10. Hydra/OFT withdrawals complete or deadline passed.
11. Protocol unwire dry-run reviewed.
12. Protocol unwire executed.
13. Disconnected checker passes.
14. Backend/planner runtime deprecated and restarted.
15. Final evidence linked.

Asset-only deprecation:

1. Decision record created.
2. Deprecated asset symbols and asset IDs listed.
3. Kept asset symbols and asset IDs listed.
4. Chain is not marked deprecated.
5. Planner changes scoped only to deprecated asset IDs.
6. Pool or Hydra/OFT exit requirements complete.
7. Protocol asset unwire dry-run reviewed.
8. Protocol asset unwire executed.
9. Pool config regenerated after protocol unwire.
10. Planner config regenerated.
11. Kept assets verified live in generated config and runtime.
12. Final evidence linked.

## Common Misses

- Forgetting USDT0.s during a full chain deprecation.
- Treating asset-only deprecation as full-chain deprecation.
- Running a full-chain planner drain when other assets must remain active.
- Setting only `maximumWeights[chain] = 0` and forgetting
  `minimalWeights[chain] = 0`.
- Treating `uint64.max` as finite credit on OFT paths.
- Fully disconnecting Hydra/OFT exits before the withdrawal deadline.
- Removing protocol config before graph-based protocol unwiring and disconnected
  checks are complete.
- Considering generated config enough without runtime planner verification.

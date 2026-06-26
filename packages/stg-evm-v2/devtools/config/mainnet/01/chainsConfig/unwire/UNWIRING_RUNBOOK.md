# Stargate Unwiring Runbook

This runbook describes the stage-local YAML inputs for Stargate unwire flows.
Use it when an asset is removed from a subset of chains, when a chain is fully
retired from messaging, or when a specific messaging direction must be disabled.

Run `make` commands from the repository root.

The active files are:

- `asset.unwire.yml`: active asset mesh unwire input.
- `messaging.unwire.yml`: active messaging unwire input.
- `messaging.disconnected-check.yml`: persistent checker input for deprecated EIDs.
- `unwired/`: archive of completed one-off unwire inputs.

Templates:

- `0-template-asset.unwire.yml`
- `0-template-messaging.unwire.yml`

## Asset Unwire

Use asset unwire when one token should stop being routable on one or more
chains, but the chains themselves still exist.

Example:

```yaml
asset: usdc
disconnect_chains:
  - sei-mainnet
remaining_chains: []
```

`remaining_chains` is optional. When empty or omitted, the flow uses every other
chain that supports the asset.

The target is:

```bash
STAGE=mainnet make unwire-asset-mainnet CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-asset-mainnet
```

What it does:

- `asset.unwire.config.ts` builds all asset edges between:
  - `disconnect_chains -> remaining_chains`
  - `remaining_chains -> disconnect_chains`
  - `disconnect_chains -> disconnect_chains`
- Those edges configure `setOFTPath(dstEid, false)`.
- `token-messaging-asset.unwire.config.ts` and
  `credit-messaging-asset.unwire.config.ts` configure
  `setAssetId(address(0), assetId)` on the disconnected chains.

What it does not do:

- It does not remove OApp peers.
- It does not change LayerZero send/receive libraries.
- It does not change executor or DVN config.
- It does not remove credits. Pool credits should be drained or set to zero by
  the planner or the relevant operational process.

## Messaging Unwire

Use messaging unwire when TokenMessaging and CreditMessaging paths should be
disabled. This can be a full chain shutdown or a directional block.

Example:

```yaml
rules:
  - chain: swell-mainnet
    direction: both
    allowed_peers:
      - swell-mainnet
```

`allowed_peers` is the keep-list for that rule. Every supported messaging chain
that is not the rule chain and not in `allowed_peers` is treated as a peer to
unwire.

`direction` is required:

- `both`: disable `chain -> peers` and `peers -> chain`.
- `from`: disable only `chain -> peers`.
- `to`: disable only `peers -> chain`.

Run:

```bash
STAGE=mainnet make unwire-chain-mainnet CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-chain-mainnet
```

The target runs TokenMessaging first and CreditMessaging second:

1. `stg:unwire::token-messaging`
2. `stg:unwire::credit-messaging`

### Edge Semantics

A graph edge `A -> B` is local to contract `A` and remote to endpoint `B`.
On that local contract:

- `sendConfig` controls messages sent from `A` to `B`.
- `receiveConfig` controls messages received by `A` from `B`.
- `setPeer(B, bytes32(0))` clears `A`'s peer for `B`.

The peer mapping is not purely send-only. Clearing a peer can affect both local
sending to that remote and local receive validation from that remote. For any
one-way unwire where the opposite direction must keep working, transaction
review must be strict.

For a full shutdown, `direction: both` is the normal choice.

For a one-way unwire:

- `direction: from` means the named chain should stop sending to non-allowed
  peers. The opposite `peers -> chain` path is expected to keep working.
- `direction: to` means non-allowed peers should stop sending to the named
  chain. The opposite `chain -> peers` path is expected to keep working.

For one-way Glue-style unwires, do not accept receive DVN transactions that set
the still-needed reverse path to DeadDVN. That is the failure mode that causes
LayerZero config errors such as probable DVN mismatch when Glue sends back to
the other chain.

## By-EID Unwire

Use by-EID unwire when a deprecated chain has already been scrubbed from active
YAML or deployments, so the graph can no longer resolve it by chain name.

```bash
STAGE=mainnet make unwire-chain-by-eid DEAD_EIDS=30318,30101 CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-chain-by-eid DEAD_EIDS=30318,30101
```

This iterates active messaging chains and calls `setPeer(deadEid, bytes32(0))`
on TokenMessaging and CreditMessaging where the peer is still present.

It does not configure executor, DVNs, send libraries, receive libraries, or
asset state. It is only a stale-peer cleanup tool.

## Disconnected Checker

The checker verifies that deprecated EIDs are no longer peered from active
messaging contracts.

Config file:

```yaml
deprecated_eids:
  - eid: 30335
    chain: swell-mainnet
    notes: >
      Shut down on June 23, 2026. Had ETH native pool.

# Optional. If omitted, all active messaging chains are checked.
# active_chains:
#   - ethereum-mainnet
#   - arbitrum-mainnet
```

Run:

```bash
STAGE=mainnet make check-messaging-disconnected
STAGE=mainnet make check-messaging-disconnected CONFIGURE_ARGS_COMMON=--logs
```

What it checks:

- For every deprecated EID and every active chain, TokenMessaging
  `hasPeer(deprecatedEid, null)` must be true.
- The same check is run on CreditMessaging.

What it does not check:

- DVN config.
- Executor config.
- Send/receive libraries.
- Asset `setOFTPath`.
- Messaging asset IDs.
- Credits or liquidity.

Use the checker for full deprecated-chain disconnections. Do not use it as the
success criterion for a one-way messaging unwire, because one-way paths may
intentionally keep a peer or receive path alive.

## Repair: Glue Receive DVNs

If a one-way Glue unwire accidentally set live chains' receive config from Glue
to DeadDVN, restore those receive DVNs with:

```bash
STAGE=mainnet pnpm --filter @stargatefinance/stg-evm-v2 run hardhat stg:restore::glue-receive-dvns --messaging token --dry-run
STAGE=mainnet pnpm --filter @stargatefinance/stg-evm-v2 run hardhat stg:restore::glue-receive-dvns --messaging token --onesig
```

Use `--messaging credit` or omit `--messaging` to process both token and credit.

Expected restore transactions are receive-config `setConfig` calls only. Do not
expect send-config, executor, or `setPeer` transactions from this repair task.

## Transaction Review Checklist

Always dry-run first. The dry run is the safety gate.

```bash
STAGE=mainnet make unwire-asset-mainnet CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-chain-mainnet CONFIGURE_ARGS_COMMON=--dry-run
```

### Asset Unwire Expected Transactions

Expect:

- `setOFTPath(dstEid, false)` on asset contracts for the disconnected asset.
- `setAssetId(address(0), assetId)` on TokenMessaging for each disconnected
  chain.
- `setAssetId(address(0), assetId)` on CreditMessaging for each disconnected
  chain.
- `setPlanner(...)` only if the planner is already drifted from config.

Do not expect:

- `setPeer(...)`.
- Send/receive DVN changes.
- Executor changes.
- LayerZero send/receive library changes.
- `setOFTPath(..., true)`.
- Asset ID changes on remaining chains.

### Full Messaging Unwire Expected Transactions

For `direction: both`, expect some or all of these on both sides of each
disconnected path:

- Send ULN config to local DeadDVN.
- Send executor config to `address(0)`.
- Receive ULN config to local DeadDVN.
- `setPeer(remoteEid, bytes32(0))`.
- Owner, delegate, planner, or asset config transactions only if those values
  have drifted from the generated graph.

Do not expect:

- `setPeer(remoteEid, nonzeroPeer)`.
- Normal production DVNs on a path intended to be disabled.
- New peer creation.
- Asset path or fee-lib changes from the messaging unwire target.

### One-Way Messaging Unwire Expected Transactions

For `direction: from`, the intended disabled path is named chain to peers.

For `direction: to`, the intended disabled path is peers to named chain.

If the opposite direction must continue working, expect only the local send-side
disable for the direction being unwired. Treat these as stop-and-review items:

- A receive ULN config changing to DeadDVN for a path that must keep receiving.
- `setPeer(remoteEid, bytes32(0))` on a local contract that must still send to
  or receive from that remote.
- Any transaction touching the reverse path that the runbook says should remain
  live.

If any stop-and-review item appears, do not submit the batch. Fix the graph or
split the operation before signing.

### By-EID Expected Transactions

Expect only:

- `setPeer(deadEid, bytes32(0))` on TokenMessaging.
- `setPeer(deadEid, bytes32(0))` on CreditMessaging.

Do not expect:

- DVN or executor changes.
- Asset config changes.
- Any transaction involving an active chain EID as the dead EID.

## File Order

For a full chain sunset:

1. Keep the chain YAML and deployments available. The normal graph-based unwire
   needs them to resolve contracts and generated paths.
2. If the chain has active assets, create `asset.unwire.yml` from the template
   and dry-run `make unwire-asset-mainnet`.
3. Review and submit the asset unwire transactions.
4. Create `messaging.unwire.yml` from the template and dry-run
   `make unwire-chain-mainnet`.
5. Review and submit TokenMessaging and CreditMessaging unwire transactions.
6. Add the deprecated EID to `messaging.disconnected-check.yml`.
7. Run `make check-messaging-disconnected`.
8. Archive the active YAML inputs into `unwired/` with descriptive names, for
   example:
   - `unwired/asset.unwire-swell-eth.yml`
   - `unwired/messaging.unwire-swell.yml`
9. Remove the active one-off files:
   - `asset.unwire.yml`
   - `messaging.unwire.yml`
10. Only after the checker passes, remove the chain from active config files.
    For a full chain removal this usually includes the chain's
    `chainsConfig/<chain>.yml` and any active references that would make normal
    graph generation include it.

If the chain files were removed before peers were cleared, use
`make unwire-chain-by-eid DEAD_EIDS=...` and then run the checker.

For an asset-only removal:

1. Keep the asset in the chain YAML until the asset unwire transactions are
   generated and submitted.
2. Create and run `asset.unwire.yml`.
3. After successful execution, remove or update the asset entry from the
   disconnected chain's YAML if the asset is no longer supported there.
4. Archive the active asset unwire file under `unwired/`.
5. Remove the active `asset.unwire.yml`.

For a one-way messaging change:

1. Create `messaging.unwire.yml` with the narrowest possible rule.
2. Dry-run the messaging target.
3. Review the transaction list against the one-way checklist above.
4. Submit only if the reverse path remains untouched.
5. Archive and remove the active `messaging.unwire.yml`.
6. Do not add the chain to `messaging.disconnected-check.yml` unless the chain
   is fully deprecated.

## Why The Order Matters

- Graph-based unwire should run before deleting chain files because it needs
  active config and deployments to resolve contracts.
- Asset unwire should happen before full messaging shutdown so asset routes are
  disabled explicitly before transport is removed.
- The checker should run after messaging transactions land because it reads
  on-chain peer state.
- Active `asset.unwire.yml` and `messaging.unwire.yml` should be removed after
  use so later runs do not accidentally reprocess an old operation.

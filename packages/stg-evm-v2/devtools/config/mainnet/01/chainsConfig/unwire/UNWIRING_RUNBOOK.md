# Stargate Unwiring Runbook

This runbook describes the stage-local inputs and review process for Stargate
asset and messaging unwires. Run all `make` commands from the repository root.

Active inputs:

- `chainsConfig/unwire/asset.unwire.yml`: one active asset unwire at a time.
- `chainsConfig/<chain>.yml`: chain config, including messaging unwire rules
  under `unwire`.
- `chainsConfig/unwire/messaging.disconnected-check.yml`: persistent checker
  input for fully deprecated EIDs.
- `chainsConfig/unwire/unwired/`: archive for completed one-off asset unwire
  inputs.

Templates:

- `chainsConfig/unwire/0-template-asset.unwire.yml`
- `chainsConfig/0-template-chain.yml`

General rules:

- Always dry-run first.
- Do not remove chain config, deployments, definitions, or Hardhat network
  entries before graph-based unwire is done.
- Mark chain sunsets as `status: DEPRECATED` before normal wire/configure can
  re-include them.

## Asset Unwire

Use asset unwire when one token should stop being routable on one or more
chains, while the chain may still participate in other assets or messaging.

Example `chainsConfig/unwire/asset.unwire.yml`:

```yaml
asset: usdc
disconnect_chains:
  - sei-mainnet
remaining_chains: []
```

`remaining_chains` is optional. When empty or omitted, the flow uses every other
active chain that supports the asset.

Run:

```bash
STAGE=mainnet make unwire-asset-mainnet CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-asset-mainnet
```

### Files

Add:

- `chainsConfig/unwire/asset.unwire.yml`

Keep until the asset unwire transactions land:

- the asset under `tokens:` in `chainsConfig/<chain>.yml`
- asset entries in `packages/stg-definitions-v2/src/constant.ts`
- asset deployments under `packages/stg-evm-v2/deployments/<chain>/`
- SDK asset deployments under `packages/stg-evm-sdk-v2/deployments/<chain>/`

After the transactions land:

- remove the asset from `tokens:` in `chainsConfig/<chain>.yml`, and move it to
  `unwired_tokens:` for historical visibility
- archive `chainsConfig/unwire/asset.unwire.yml` under
  `chainsConfig/unwire/unwired/`
- remove the active `chainsConfig/unwire/asset.unwire.yml`
- remove asset-specific entries from `packages/stg-definitions-v2/src/constant.ts`
  only if no remaining config path uses them

Do not remove chain-level messaging, Hardhat, Safe, OneSig, or deployment config
for an asset-only unwire.

### Expected Transactions

Expect:

- `setOFTPath(dstEid, false)` on asset contracts for the disconnected asset.
- `setAssetId(address(0), assetId)` on TokenMessaging for each disconnected
  chain.
- `setAssetId(address(0), assetId)` on CreditMessaging for each disconnected
  chain.

Do not expect:

- `setPeer(...)`.
- Send or receive DVN changes.
- Executor changes.
- LayerZero send or receive library changes.
- `setOFTPath(..., true)`.
- Asset ID changes on remaining chains.

## Messaging Unwire

Use messaging unwire when TokenMessaging and CreditMessaging paths should be
disabled for a chain.

Messaging unwire is configured in `chainsConfig/<chain>.yml`:

```yaml
name: swell-mainnet
status: DEPRECATED

unwire:
  token_messaging:
    direction: both
    allowed_peers:
      - swell-mainnet
  credit_messaging:
    direction: both
    allowed_peers:
      - swell-mainnet
```

`status: DEPRECATED` keeps the chain resolvable for unwire but excludes it from
normal wire/configure graphs.

`allowed_peers` is the keep-list for that messaging contract. Every active
messaging chain that is not the unwire chain and not in `allowed_peers` is
treated as a peer to unwire. The field is required; for a full deprecation, use
the chain itself as the only allowed peer.

`direction` is required:

- `both`: disable `chain -> peers` and `peers -> chain`.
- `from`: disable only `chain -> peers`.
- `to`: disable only `peers -> chain`.

Run both TokenMessaging and CreditMessaging once with the chain target:

```bash
STAGE=mainnet make unwire-chain-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-chain-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--onesig
```

Or call each messaging contract separately when reviewing or executing a split
operation:

```bash
STAGE=mainnet make unwire-token-messaging-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-token-messaging-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--onesig
STAGE=mainnet make unwire-credit-messaging-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-credit-messaging-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--onesig
```

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

### Pool Chain Messaging Unwire

Use the pool chain flow when a pool chain is being deprecated and the deployed
assets no longer hold user funds. This is usually safe for pool chains
because funds and credits are drained before the messaging unwire happens, so no
user exit path needs to stay open through TokenMessaging.

This flow executes a full unwire for incoming and outgoing paths on both OApps:
TokenMessaging and CreditMessaging. It is safe only after credits and funds are
fully drained, because no funds should be lost when both directions are
disconnected at once.

Config:

```yaml
status: DEPRECATED

unwire:
  token_messaging:
    # Pool chains use both after funds are drained because users no longer need
    # a TokenMessaging exit path from the deprecated chain.
    direction: both
    allowed_peers:
      - <chain>
  credit_messaging:
    # CreditMessaging can be fully unwired once credits are drained/.
    direction: both
    allowed_peers:
      - <chain>
```

Order:

1. Drain or account for all pool funds and credits.
2. Mark the chain `status: DEPRECATED`.
3. Add `direction: both` for TokenMessaging and CreditMessaging.
4. Run `make unwire-chain-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--dry-run`
   and verify transactions to propose match the expected transaction list.
5. Propose the unwire transactions through OneSig with
   `make unwire-chain-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--onesig`.
6. Wait for the OneSig transactions to be executed on-chain.
7. Add the EID to `messaging.disconnected-check.yml`.
8. Run `make check-messaging-disconnected`.
9. Remove chain-level config only after the checker passes.

Expected transactions for `direction: both`:

- Send ULN config to local DeadDVN.
- Send executor config to `address(0)`.
- Receive ULN config to local DeadDVN.
- `setPeer(remoteEid, bytes32(0))`.

Do not expect:

- `setPeer(remoteEid, nonzeroPeer)`.
- Normal production DVNs on a path intended to be disabled.
- New peer creation.
- Asset path or fee-lib changes from the messaging unwire target.
- Owner, delegate, planner, or asset config changes as part of the unwire. If
  they appear, they are config drift and should be reviewed separately.

Keep until the disconnected checker passes:

- `chainsConfig/<chain>.yml`
- `packages/stg-evm-v2/deployments/<chain>/`
- `packages/stg-evm-sdk-v2/deployments/<chain>/`
- chain entries in `packages/stg-definitions-v2/src/constant.ts`
- the chain network entry in `packages/stg-evm-v2/hardhat.config.ts`

After the checker passes:

Keep these files for traceability:
- `chainsConfig/<chain>.yml`
- `packages/stg-evm-v2/deployments/<chain>/`
- `packages/stg-evm-sdk-v2/deployments/<chain>/`

Remove the chain from active config:
- chain-level entries in `packages/stg-definitions-v2/src/constant.ts`
  - DVNs and executor for the EID
  - `NETWORKS[EndpointId.<CHAIN>_V2_MAINNET]`
  - asset entries for the EID
  - OFT wrapper, treasurer, rewarder, staking, or other chain-specific entries
- the chain network entry in `packages/stg-evm-v2/hardhat.config.ts`

### Hydra Chain Messaging Unwire

Use the Hydra flow when users still need time to exit funds. Hydra needs two
messaging phases because TokenMessaging outbound paths may still be needed while
new inbound flow into the deprecated chain should be stopped.

CreditMessaging can be fully unwired in phase 1 only after credits are drained.

#### Phase 1: Stop New Inbound TokenMessaging

Config:

```yaml
status: DEPRECATED

unwire:
  token_messaging:
    # Only unwire paths going to the deprecated chain. Outgoing paths remain
    # active so users can get funds out of the chain.
    direction: to
    allowed_peers:
      - <chain>
  credit_messaging:
    direction: both
    allowed_peers:
      - <chain>
```

Run:

```bash
STAGE=mainnet make unwire-chain-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-chain-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--onesig
```

Expected TokenMessaging transactions:

- Only local send-side DeadDVN changes on peers sending to the Hydra chain.
- No receive ULN config changes.
- No executor zeroing.
- No `setPeer(remoteEid, bytes32(0))`.

Expected CreditMessaging transactions:

- Full `direction: both` unwire transactions, because credits were drained
  before this phase.

Do not expect for TokenMessaging phase 1:

- Receive ULN config changing to DeadDVN.
- Executor config changing to `address(0)`.
- Peer removal.
- Any transaction that disables the reverse path needed for users to exit.

Do not remove files in phase 1. Keep chain config, deployments, definitions, and
Hardhat network entries so phase 2 and any checks can still resolve the chain.
Do not use `messaging.disconnected-check.yml` as the success criterion for this
phase, because TokenMessaging may intentionally remain peered.

#### Phase 2: Full TokenMessaging Disconnect

Run this after pending messages are safe and user exit flow no longer needs the
Hydra TokenMessaging paths.

Update:

```yaml
unwire:
  token_messaging:
    # Final phase: disable all remaining TokenMessaging paths in both directions.
    direction: both
    allowed_peers:
      - <chain>
  credit_messaging:
    direction: both
    allowed_peers:
      - <chain>
```

Run:

```bash
STAGE=mainnet make unwire-token-messaging-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-token-messaging-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--onesig
```

Then add the EID to `messaging.disconnected-check.yml` and run:

```bash
STAGE=mainnet make check-messaging-disconnected
```

Expected TokenMessaging transactions are the same as full `direction: both`:

- Send ULN config to local DeadDVN.
- Send executor config to `address(0)`.
- Receive ULN config to local DeadDVN.
- `setPeer(remoteEid, bytes32(0))`.

After the checker passes, use the same cleanup list as the pool chain flow.

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
- Send or receive libraries.
- Asset `setOFTPath`.
- Messaging asset IDs.
- Credits or liquidity.

Use the checker for full deprecated-chain disconnections. Do not use it for
Hydra phase 1 or any other one-way messaging unwire.

## By-EID Unwire

Use by-EID unwire only when a deprecated chain has already been removed from
active YAML or deployments, so the graph can no longer resolve it by chain name.

```bash
STAGE=mainnet make unwire-chain-by-eid DEAD_EIDS=30318,30101 CONFIGURE_ARGS_COMMON=--dry-run
STAGE=mainnet make unwire-chain-by-eid DEAD_EIDS=30318,30101
```

Expected transactions:

- `setPeer(deadEid, bytes32(0))` on TokenMessaging.
- `setPeer(deadEid, bytes32(0))` on CreditMessaging.

Do not expect:

- DVN or executor changes.
- Asset config changes.
- Any transaction involving an active chain EID as the dead EID.

This is only a stale-peer cleanup tool. Prefer graph-based unwire before
deleting chain files.

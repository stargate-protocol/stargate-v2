# Protocol Unwiring

This is the canonical Stargate protocol unwiring runbook for chain and asset
deprecation. Use it with the [chain deprecation overview](./README.md) and the
[planner deprecation runbook](https://github.com/LayerZero-Labs/monorepo-internal/blob/4630b39de4cd0a4c2dd06b579040b34156b79ae9/legacy/offchain-monorepo/apps/stargate/docs/PLANNER_DEPRECATION.md)
in `monorepo-internal`.

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
make unwire-asset-mainnet CONFIGURE_ARGS_COMMON=--dry-run
make unwire-asset-mainnet
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

Use the Make targets for normal operation. Pass the target chain as
`UNWIRE_CHAIN=<chain-name>`:

```bash
make unwire-chain-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--dry-run
make unwire-chain-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--onesig
```

The underlying Hardhat tasks read the same `UNWIRE_CHAIN` environment variable.

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

TokenMessaging and CreditMessaging are fully unwired in both Pool and Hydra
shutdowns; the difference is sequencing:

- Pool chains split TokenMessaging into two operational steps that can happen
  the same day or shortly apart. First disable outgoing TokenMessaging with
  `direction: from`; then, once no in-flight messages remain, fully disconnect
  TokenMessaging with `direction: both`. CreditMessaging is fully unwired once
  with `direction: both`.
- Hydra chains also use two steps, but they are separate shutdown phases.
  Phase 1 uses TokenMessaging `direction: to` and CreditMessaging
  `direction: both`; phase 2 uses TokenMessaging `direction: both` after
  user-held supply is drained or the withdrawal window closes.

Run both TokenMessaging and CreditMessaging once with the chain target:

```bash
make unwire-chain-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--dry-run
make unwire-chain-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--onesig
```

Or call each messaging Make target separately when reviewing or executing a
split operation:

```bash
make unwire-token-messaging-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--dry-run
make unwire-token-messaging-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--onesig
make unwire-credit-messaging-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--dry-run
make unwire-credit-messaging-mainnet UNWIRE_CHAIN=swell-mainnet CONFIGURE_ARGS_COMMON=--onesig
```

### Edge Semantics

A graph edge `A -> B` is local to contract `A` and remote to endpoint `B`.
On that local contract:

- `sendConfig` controls messages sent from `A` to `B`.
- `receiveConfig` controls messages received by `A` from `B`.
- `setPeer(B, bytes32(0))` clears `A`'s peer for `B`.

The peer mapping is not send-only. Clearing a peer disables messaging for that
local/remote pair. The local contract can no longer send messages to that
remote, and inbound messages from that remote will fail peer validation.

### Pool Chain Messaging Unwire

A pool chain is a Stargate-supported chain where every deployed asset has a
local Pool that locks ERC20s on bridge-out and unlocks them on bridge-in.

Use this flow only after the pool side is ready to shut down:

- LPs were notified and the LP exit window is complete.
- Pool funds are drained or within the approved dust threshold.
- Treasury fees were withdrawn or explicitly accounted for.
- Finite planner credits are drained or within the approved dust threshold.

At that point, no user exit path needs to stay open on TokenMessaging. The only
remaining TokenMessaging risk is in-flight messages that were already sent from
the deprecated chain.

Pool chain unwire therefore runs in this order:

1. Stop outgoing TokenMessaging with `direction: from`.
2. Fully unwire CreditMessaging with `direction: both`.
3. Wait until there are no in-flight TokenMessaging messages from the deprecated
   chain.
4. Fully disconnect TokenMessaging with `direction: both`.
5. Add the EID to `messaging.disconnected-check.yml` and run the disconnected
   checker.

Step 1 only stops sends `from` the deprecated chain, not `to` it, because the
reverse direction is already blocked: the deprecated chain's inbound credits were
drained to zero during planner deprecation, so no active chain can allocate
credit to route into it. There is therefore no need to stop sends from both sides
at this step.

The split between step 1 and step 4 prevents already-sent outbound messages from
getting stuck. If TokenMessaging is fully disconnected while an outbound message
is still in flight, the destination peer may already be removed and the message
will not deliver. Recovering that message would require wiring the path again.

For very low-activity chains, a single full `direction: both` TokenMessaging
unwire may be acceptable only if the team explicitly accepts that stuck-message
risk. Prefer the two-step flow.

#### Pool Drain and LP Considerations

Pool assets must be drained before protocol unwiring starts. LPs hold LP tokens
that represent a claim on local pool liquidity and credits on that chain, so
LPs must be able to redeem their funds before the pool is disconnected.

LPs should be notified that the pool is being deprecated and given a deadline to
withdraw. During the LP exit window and pool drain, keep pool funds and credits
safe so LPs can redeem normally. After the deadline passes, the remaining pool
balance can be fully drained and protocol unwiring can start.

Pools are drained by transferring assets into the deprecated chain. Those
transfers unlock ERC20s from the local pool. After the ERC20s are unlocked, they
should be bridged out through another route, not through Stargate.

#### Step 1: Stop Outgoing TokenMessaging

First stop new TokenMessaging messages from the deprecated chain to the rest of
the mesh. This keeps peer and receive-side config in place so already-sent
messages can still land on destination chains.

Config:

```yaml
status: DEPRECATED

unwire:
  token_messaging:
    # First disable only deprecated-chain -> peers.
    direction: from
    allowed_peers:
      - <chain>
  credit_messaging:
    direction: both
    allowed_peers:
      - <chain>
```

Order:

1. Drain or account for all pool funds and credits, and withdraw or explicitly
   account for treasury fees.
2. Mark the chain `status: DEPRECATED`.
3. Add `direction: from` for TokenMessaging and `direction: both` for
   CreditMessaging.
4. Run `make unwire-chain-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--dry-run`
   and verify transactions to propose match the expected transaction list.
5. Propose the unwire transactions through OneSig with
   `make unwire-chain-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--onesig`.
6. Wait for the OneSig transactions to be executed on-chain.

Expected TokenMessaging transactions for `direction: from`:

- Send ULN config to local DeadDVN.

Do not expect for TokenMessaging:

- Receive ULN config changes.
- Executor config changing to `address(0)`.
- `setPeer(remoteEid, bytes32(0))`.
- `setPeer(remoteEid, nonzeroPeer)`.
- Asset path or fee-lib changes from the messaging unwire target.
- Owner, delegate, planner, or asset config changes as part of the unwire. If
  they appear, they are config drift and should be reviewed separately.

Expected CreditMessaging transactions for `direction: both`:

- Send ULN config to local DeadDVN.
- Send executor config to `address(0)`.
- Receive ULN config to local DeadDVN.
- `setPeer(remoteEid, bytes32(0))`.

#### Step 2: Full TokenMessaging Disconnect

Run this after confirming there are no in-flight messages from the deprecated
chain to any peer.

Update:

```yaml
unwire:
  token_messaging:
    direction: both
    allowed_peers:
      - <chain>
  credit_messaging:
    # Already applied in step 1.
    direction: both
    allowed_peers:
      - <chain>
```

Run TokenMessaging only:

```bash
make unwire-token-messaging-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--dry-run
make unwire-token-messaging-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--onesig
```

Expected TokenMessaging transactions for `direction: both`:

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

After step 2 transactions execute:

1. Add the EID to `messaging.disconnected-check.yml`.
2. Run `make check-messaging-disconnected`.
3. Remove chain-level config only after the checker passes.

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

A Hydra chain is a Stargate-supported chain where at least one deployed asset is
a Hydra asset that burns on bridge-out and mints on bridge-in. Since Hydra funds
are held by users and not by a Pool, there is no pool balance to drain; users
must withdraw their funds themselves.

While user-held Hydra supply/liquidity remains and the withdrawal window is open,
TokenMessaging outbound paths from the deprecated chain must remain active so
users can withdraw to other chains. Ideally, supply should go to zero before
the final disconnect.

Hydra therefore cannot be fully disconnected in the first step. Its two steps
are shutdown phases: phase 1 stops new inbound transfers while preserving exits,
and phase 2 fully disconnects after supply is drained or the maximum withdrawal
window is reached.

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
make unwire-chain-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--dry-run
make unwire-chain-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--onesig
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

If the chain has already shut down and its RPC is unavailable, mark it first in
the chain YAML by adding `chain_shutdown: true` under `unwire` (requires
`status: DEPRECATED` and `direction: both`). This omits the dead chain side while
still fully unwiring the path on every live chain. Keep
`NETWORKS[EndpointId.<CHAIN>_V2_MAINNET]` populated until this unwire completes;
shutdown mode skips the dead chain RPC but still reads its messaging settings to
build the live-side configuration.

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
make unwire-token-messaging-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--dry-run
make unwire-token-messaging-mainnet UNWIRE_CHAIN=<chain> CONFIGURE_ARGS_COMMON=--onesig
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

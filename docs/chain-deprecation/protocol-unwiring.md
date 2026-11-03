# Protocol Unwiring Reference

Configuration fields and transaction effects for the unwiring tools.

## Inputs

Paths below are relative to
`packages/stg-evm-v2/devtools/config/mainnet/01/chainsConfig/`:

- `unwire/asset.unwire.yml`: active asset unwire input.
- `<chain>.yml`: messaging unwire rules under `unwire`.
- `unwire/messaging.disconnected-check.yml`: deprecated EIDs to check.
- `unwire/unwired/`: completed asset unwire inputs.

Templates: `unwire/0-template-asset.unwire.yml` and `0-template-chain.yml`.

## Asset Unwire

`unwire-asset-mainnet` reads:

```yaml
asset: usdc
disconnect_chains:
  - sei-mainnet
remaining_chains: []
```

Empty or omitted `remaining_chains` selects every other chain with the asset
configured, including `DEPRECATED` chains. An explicit list overrides this.
The lists must not overlap or contain duplicates.

Expected transactions:

- `setOFTPath(dstEid, false)` for the disconnected asset paths.
- `setAssetId(address(0), assetId)` on both messaging contracts on disconnected chains.

Asset unwiring does not change messaging peers, DVNs, executors, libraries,
or asset IDs on remaining chains.

## Messaging Unwire

Set `UNWIRE_CHAIN` to the chain name. Rules are read from its chain YAML:

```yaml
status: DEPRECATED
unwire:
  token_messaging:
    direction: both
    allowed_peers:
      - <chain>
  credit_messaging:
    direction: both
    allowed_peers:
      - <chain>
```

- `status: DEPRECATED` excludes the chain from normal wiring but keeps it
  available to unwiring tools.
- `allowed_peers` is a required keep-list. For a full disconnection, list only
  the chain itself.
- `deprecated_peers` adds connected deprecated chains to the peer list;
  otherwise only active peers are included. Listed chains must support the
  messaging contract, be reachable, and not have `chain_shutdown: true`.
  Entries cannot repeat, name the target chain, or also appear in `allowed_peers`.

Each messaging rule requires a `direction`:

- `from`: disable sends from the chain to its peers.
- `to`: disable sends from peers to the chain.
- `both`: disconnect both directions.

`unwire-chain-mainnet` runs both messaging targets and requires both rules.
`unwire-token-messaging-mainnet` and `unwire-credit-messaging-mainnet` run
only their respective target.

### Transaction Effects

For `from` or `to`, only the sender's send ULN config changes to its local
DeadDVN. Receive config, executors and peers remain unchanged.

For `both`, each side gets send and receive ULN config pointing to its local
DeadDVN, a zero send executor, and `setPeer(remoteEid, bytes32(0))`.
Clearing a peer blocks both sending and receiving on that local/remote pair,
including delivery of messages already sent.

Owner, delegate, planner or asset changes indicate configuration drift and
need separate review. Messaging unwiring does not change asset paths or FeeLib.

### Unavailable Chains

`chain_shutdown: true` under `unwire` skips the unavailable chain's RPC and
generates transactions only for its live peers. It requires
`status: DEPRECATED` and `direction: both`. Keep the chain's `NETWORKS` entry
until unwiring finishes; the tools still need its messaging settings.

## Disconnected Checker

`check-messaging-disconnected` reads `deprecated_eids` from its input file.
Optional `active_chains` limits the checks; otherwise all active messaging
chains are checked. `CONFIGURE_ARGS_COMMON=--logs` enables detailed output.

Both TokenMessaging and CreditMessaging must have zero peers for each
deprecated EID. The checker does not cover other deprecated chains, DVNs,
executors, libraries, asset paths, asset IDs, credits or liquidity.
Verify deprecated-to-deprecated routes separately.

Use it for full disconnections. One-way unwiring intentionally keeps peers set.

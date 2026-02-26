# Stargate V2 Credit System — Protocol Deep Dive

## Overview

Credits are Stargate V2's **capacity reservation system**. Each pool contract maintains a `paths` mapping that tracks how much outbound transfer capacity is allocated to each destination chain.

```
mapping(uint32 eid => Path { uint64 credit }) public paths;
```

Credit is denominated in **shared decimals (SD)** — a normalized precision (typically 6 decimals) used across all chains for a given asset.

## Key Contracts

| File | Role |
|------|------|
| `Path.sol` | PathLib — credit state, increase/decrease/unlimited logic |
| `StargateBase.sol` | sendCredits/receiveCredits entry points, transfer credit consumption |
| `StargatePool.sol` | Integration with poolBalance/tvl, _postInflow/_postOutflow |
| `CreditMessaging.sol` | Cross-chain credit orchestration via LayerZero |

## Credit Lifecycle

### 1. LP Deposit
When a user deposits tokens into a pool:
```solidity
function _postInflow(uint64 _amountSD) internal override {
    paths[localEid].increaseCredit(_amountSD);  // Self-credit grows
    poolBalanceSD += _amountSD;                  // Pool balance grows
}
```

### 2. Planner Allocates Credit
The planner calls `sendCredits(dstEid, credits)` to move credit from the local reserve to remote paths:
- Source pool: `paths[srcEid].tryDecreaseCredit(amount, minAmount)` — local credit decreases
- Via LayerZero message to destination
- Destination pool: `paths[srcEid].increaseCredit(amount)` — remote credit on destination increases

### 3. User Transfer
When a bridge transfer executes:
- Source: `paths[dstEid].decreaseCredit(amountOutSD)` — outbound credit consumed
- Source: `_inflow()` — sender's tokens enter the pool (poolBalance increases)
- Destination: `_outflow()` — tokens released to recipient (poolBalance decreases)

### 4. LP Redemption
```solidity
function _postOutflow(uint64 _amountSD) internal override {
    poolBalanceSD -= _amountSD;  // Balance decreases, but NO credit change
}
```

## Credit Invariant (Approximate)

For a POOL-type contract:
```
paths[localEid].credit + Σ paths[remoteEid].credit  ≈  poolBalanceSD
```

**This is approximate, not exact.** Credits drift from poolBalance because:
- Transfers modify both credit and poolBalance, but at different rates
- LP deposits/redemptions change poolBalance and self-credit, but not remote credits
- The planner reallocates credits periodically, not continuously

Empirical observations (Feb 2026):

| Pool | Total Finite Credit | Pool Balance | Credit/Balance |
|------|-------------------:|-------------:|:--------------:|
| Ethereum USDC | 8.2M | 6.1M | 135.5% |
| Arbitrum USDC | 2.1M | 4.9M | 43.7% |
| Base USDC | 6.2M | 7.3M | 86.0% |
| Ethereum USDT | 1.3M | 1.7M | 79.0% |

## OFT Credits — Always Unlimited

OFT paths use a sentinel value: `credit = type(uint64).max = 18446744073709551615`

```solidity
function isOFTPath(Path storage _path) internal view returns (bool) {
    return _path.credit == UNLIMITED_CREDIT;
}
```

**Why?** OFTs mint/burn tokens on demand. They don't hold a finite token balance, so per-path credit caps are meaningless. The real constraint for an OFT path is the SOURCE pool's balance (for POOL→OFT) or nothing (for OFT→OFT).

Typical path breakdown per pool:
- **~15 finite paths** → POOL→POOL routes (e.g., Ethereum→Arbitrum USDC)
- **~44 unlimited paths** → POOL→OFT routes (e.g., Ethereum→Bera USDC.e)

## Three Path Categories

| Path Type | Credit | Meaning | Summable? |
|-----------|--------|---------|-----------|
| POOL → POOL | Finite uint64 | Planner-allocated outbound capacity | Yes |
| POOL → OFT | Unlimited (uint64.max) | OFT mints freely, pool balance is the real limit | No |
| OFT → any | Unlimited (uint64.max) | OFT burns on source, mints/releases on dest | No |

## Credit vs TVL vs Pool Balance

These are **three different things**:

| Metric | What It Measures | Changes When |
|--------|-----------------|--------------|
| **Credit** (paths) | Planner's capacity allocation per route | Planner sends credits, transfers consume credit, deposits add self-credit |
| **poolBalance** | Actual tokens held by the contract | Deposits, redemptions, and bridge transfers (inflow/outflow) |
| **TVL** | Total LP share value | LP deposits and redemptions only |

**Key relationships:**
- Net outflow destinations (Arbitrum, Base): `poolBalance >> TVL` — tokens flowed in via bridges
- Net inflow sources (Ethereum): `poolBalance < TVL` — tokens flowed out, creating a **deficit**
- `deficit = max(0, tvlSD + deficitOffsetSD - poolBalanceSD)`

## Self-Credit (paths[localEid])

The "unallocated reserve" — credit sitting on the local chain that the planner hasn't yet sent to any remote destination.

```
Self Credit + Remote Credits + (tokens consumed by transfers) ≈ poolBalance
```

This is important for the dashboard: without self-credit, summing only remote outbound credits will always undercount the pool's total credit picture.

## Querying Credits

### From Source (what we query)
```typescript
// For each pool on chainX, query all destination EIDs:
pool.paths(dstEid) → uint64 creditSD  // outbound capacity from this pool to dstEid
```

### From Destination (token-balance-checker also queries this)
```typescript
// For a selected source pool, also query DESTINATION pools:
destPool.paths(srcEid) → uint64 creditSD  // inbound capacity at destination from srcEid
```

Both directions are useful:
- **creditFrom** (source→dst): "How much can this pool send to destination X?"
- **creditTo** (dst→source): "How much can destination X receive from this source?"

These should be equal after credit rebalancing, but may differ during transit.

## Shared Decimals Conversion

Credits are stored in shared decimals (SD). To convert to token units:
```
tokenAmount = creditSD / 10^sharedDecimals
```

To convert to USD:
```
usdAmount = tokenAmount × tokenPrice
```

Note: `sharedDecimals` is typically 6 for all assets. For tokens with `localDecimals > sharedDecimals` (e.g., WETH with 18 local, 6 shared), the conversion factor is significant.

## Dashboard Implications

1. **Don't sum finite + unlimited credits** — unlimited credits are infinite by definition
2. **Show self-credit separately** — it reveals how much of the pool's capacity is unallocated
3. **Per-pool credit utilization** = `sum(finite remote credits) / poolBalance` — shows how aggressively the planner has allocated
4. **Credit ≠ TVL** — use credit data for capacity analysis, not for balance verification
5. **Path type matters** — POOL→POOL credits are the actionable ones for fee optimization; OFT paths are auto-unlimited

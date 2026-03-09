---
name: new-chain
argument-hint: "[chain-name]"
description: >
  Configure a new chain deployment for Stargate V2. Use this skill whenever someone
  mentions deploying Stargate to a new chain, adding a new chain to the mesh, setting up
  chain configuration, or running /new-chain. It auto-fetches EndpointId, chain ID,
  DVN addresses, and executor from LayerZero APIs, estimates nativeDropAmount via
  cast gas-price, and generates all required config files (constant.ts, hardhat.config.ts,
  chain YAML). Trigger even if the user just says "add <chain>" or "deploy to <chain>".
  IMPORTANT: Always ask the user for confirmation before proceeding with the skill.
---

# Stargate V2 — New Chain Configuration & Deployment

You are helping configure and deploy a new chain for Stargate V2. Your goal is to auto-fetch as much data as possible from LayerZero APIs and the chain's RPC, then ask the user only for what cannot be auto-resolved, generate all config files, and guide through deployment commands.

The chain name is passed as an argument: `/new-chain <chain-name>` (e.g. `/new-chain sonic`).
If no argument was given, ask for the chain name before doing anything else.

**Before starting, always confirm with the user:** "I'm about to start the new-chain configuration for `<chain-name>`. This will fetch data from LayerZero APIs, ask you configuration questions, and then generate config files. Shall I proceed?"

---

## Phase 1 — Auto-fetch chain data

Fetch all of the following **in parallel** (use WebFetch). These are public APIs, no auth needed.

### 1a. Deployments API

```
GET https://metadata.layerzero-api.com/v1/metadata/deployments
```

Find the entry whose key matches `<chain-name>` (case-insensitive). From the v2 deployment (`version: 2`), extract:

| Field | Path in JSON |
|---|---|
| **eid** (EndpointId number) | `deployments[version=2].eid` |
| **Executor address** | `deployments[version=2].executor.address` |
| **Chain ID** | `chainDetails.nativeChainId` |
| **Native currency symbol** | `chainDetails.nativeCurrency.symbol` |
| **Native currency decimals** | `chainDetails.nativeCurrency.decimals` |

The EndpointId constant follows the pattern `<CHAIN_UPPER>_V2_MAINNET` (e.g. `SONIC_V2_MAINNET` for eid 30332). Verify it exists by running:
```bash
grep '<CHAIN_UPPER>_V2_MAINNET' node_modules/@layerzerolabs/lz-definitions/dist/index.d.ts 2>/dev/null || echo "NOT_FOUND"
```

### 1b. DVN API

```
GET https://metadata.layerzero-api.com/v1/metadata/dvns?chainNames=<chain-name>
```

From the DVN map for the chain, extract addresses (the map keys) for:
- **Nethermind DVN**: entry with `id` containing "nethermind" or `canonicalName` containing "Nethermind"
- **LZ Labs DVN**: entry with `id` containing "layerzero-labs" or `canonicalName` containing "LayerZero Labs"

If a DVN is missing, mark it as `⚠ NOT FOUND — needs manual resolution` and leave a placeholder.

### 1c. Gas price for nativeDropAmount suggestion

Resolve the RPC URL using the same logic as `getRpcUrl` in `packages/stg-evm-v2/hardhat.config.ts`:

```bash
CHAIN_NAME="<chain-name>"
CHAIN_UPPER=$(echo "$CHAIN_NAME" | tr '[:lower:]' '[:upper:]')

# Try specific env var first
RPC_VAR="RPC_URL_${CHAIN_UPPER}_MAINNET"
RPC="${!RPC_VAR:-}"

# Fall back to template
if [ -z "$RPC" ]; then
  TEMPLATE="${RPC_URL_MAINNET:-}"
  if [ -n "$TEMPLATE" ]; then
    RPC="${TEMPLATE//CHAIN/$CHAIN_NAME}"
  fi
fi

# Get gas price
if [ -n "$RPC" ]; then
  GAS_PRICE=$(cast gas-price --rpc-url "$RPC" 2>/dev/null)
  if [ -n "$GAS_PRICE" ]; then
    # Calculate: gas_price * 500000 * 3
    NATIVE_DROP=$(echo "$GAS_PRICE * 500000 * 3" | bc)
    echo "GAS_PRICE=$GAS_PRICE"
    echo "NATIVE_DROP_WEI=$NATIVE_DROP"
    # Convert to ether (18 decimals)
    echo "NATIVE_DROP_ETHER=$(echo "scale=18; $NATIVE_DROP / 1000000000000000000" | bc)"
  else
    echo "CAST_FAILED"
  fi
else
  echo "NO_RPC — set RPC_URL_${CHAIN_UPPER}_MAINNET in .env.local"
fi
```

If gas price is obtained, calculate `gas_price * 500_000 * 3` and express as `parseEther('<value>').toBigInt()`.
Round to 1-4 significant figures (e.g. `parseEther('0.001')`, `parseEther('0.15')`).

---

## Phase 2 — Present summary and ask for user input

Show what was auto-fetched:

```
== Auto-fetched data ==

Chain:           <chain-name>-mainnet
EndpointId:      <CHAIN>_V2_MAINNET (eid: <number>)
Chain ID:        <number>
Native currency: <symbol> (<decimals> decimals)

LZ Labs Executor:  <address>  ✓
LZ Labs DVN:       <address>  ✓  (or ⚠ not found)
Nethermind DVN:    <address>  ✓  (or ⚠ not found)

Suggested nativeDropAmount: parseEther('<X>').toBigInt()
  ↳ Based on gas_price=<Y> wei. Confirm with Angus before using.
```

Then ask for the following (number them so the user can answer concisely):

1. **OneSig address** — multisig for ownership transfer
2. **OneSig URL slug** — usually same as chain name (default: `<chain-name>`)
3. **Assets** — which assets to deploy and their type. Format: `<asset>: <type>` (one per line). Types:
   - `native` — for ETH on native L2s
   - `pool <address>` — token already exists on chain
   - `oft` — Stargate deploys its bridged version (address assigned after deploy, or provide if already deployed like USDC.e)
   - Supported assets: `eth`, `usdc`, `usdt` (rare — USDT0 is canonical), `eurc`
   - Skip any asset not being deployed
4. **nativeDropAmount** — accept the suggestion or provide an override. Remind: must be confirmed with Angus.
5. **Extra hardhat flags** — any of: `zksync: true`, `useFeeData: true`, `isTIP20: true`, `alt: true`, `ethNetwork: '<network>'`
6. **Additional DVNs** — any chain-specific DVNs beyond Nethermind + LZ Labs (e.g. BERA, EIGEN_ZERO). Provide name + address.
7. **Rewarder/Staking** — does this chain need rewarder and/or staking config? If yes, which tokens and reward token allocations?
8. **Per-path DVN overrides** — does this chain need per-path DVN configuration? This is used when specific paths (e.g. to/from Ethereum) require different DVN setups than the default. If yes, provide for each path:
    - Target chain (e.g. `ethereum`)
    - `perPathRequiredDVNs`: which DVNs are required for that path (list of DVN names)
    - `perPathOptionalDVNs`: which DVNs are optional for that path (list of DVN names)
    - `perPathOptionalDVNsThreshold`: how many optional DVNs must verify (e.g. `2`)
    - Whether the remote chain also needs matching per-path config back to this chain (usually yes — it's bidirectional)

    Example (bera ↔ ethereum):
    ```
    Path: ethereum
    perPathRequiredDVNs: [LZ_LABS]
    perPathOptionalDVNs: [NETHERMIND, BERA, USDT0, CANARY]
    perPathOptionalDVNsThreshold: 2
    Bidirectional: yes (ethereum also gets matching config for bera path)
    ```

Wait for the user's answers before proceeding to Phase 3.

---

## Phase 3 — Generate and apply configuration

Once all data is collected, make the actual edits to files using the Edit/Write tools. Present each change clearly as you make it.

### File 1: `packages/stg-definitions-v2/src/constant.ts`

Make these additions **in alphabetical order** within each block:

#### a) DVNS.NETHERMIND
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<nethermind-dvn-address>',
```

#### b) DVNS.LZ_LABS
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<lzlabs-dvn-address>',
```

#### c) Additional DVN objects
If the user specified extra DVNs (e.g. BERA, EIGEN_ZERO), either add entries to existing objects or create new ones following the pattern:
```ts
DVNNAME: {
    [EndpointId.<CHAIN>_V2_MAINNET]: '<address>',
} satisfies Partial<Record<EndpointId, string>>,
```

#### d) EXECUTORS.LZ_LABS
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<executor-address>',
```

#### e) ASSETS — per deployed asset

For **ETH** (inside `ASSETS[TokenName.ETH].networks`):
- Native: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Native },`
- Pool: `[EndpointId.<CHAIN>_V2_MAINNET]: { symbol: 'WETH', name: 'WETH', type: StargateType.Pool, address: '<addr>' },`
- OFT: `[EndpointId.<CHAIN>_V2_MAINNET]: { symbol: 'WETH', name: 'WETH', type: StargateType.Oft },`

For **USDC** (inside `ASSETS[TokenName.USDC].networks`):
- Pool: `[EndpointId.<CHAIN>_V2_MAINNET]: { address: '<addr>', type: StargateType.Pool },`
- OFT with address: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Oft, address: '<addr>' },`
- OFT without address: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Oft },`

Same pattern for **USDT** and **EURC** (inside their respective `ASSETS[TokenName.USDT/EURC].networks`).

#### f) NETWORKS_CONFIG — the main config block

Standard pattern (most common case):
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: {
    creditMessaging: {
        ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        requiredDVNs: [DVNS.NETHERMIND[EndpointId.<CHAIN>_V2_MAINNET], DVNS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET]],
        executor: EXECUTORS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET],
    },
    tokenMessaging: {
        ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
        requiredDVNs: [DVNS.NETHERMIND[EndpointId.<CHAIN>_V2_MAINNET], DVNS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET]],
        executor: EXECUTORS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET],
        nativeDropAmount: parseEther('<X>').toBigInt(),
    },
    oneSigConfig: {
        oneSigAddress: '<onesig-address>',
        oneSigUrl: `${process.env.BASE_ONE_SIG_URL_MAINNET}/<slug>`,
    },
},
```

Variations:
- **No messaging**: omit `creditMessaging` and/or `tokenMessaging` (like blast-mainnet which has only oneSig)
- **Extra DVNs with per-path config**: see section below
- **Custom gas limits**: add `busGasLimit` and/or `nativeDropGasLimit` to tokenMessaging (only when explicitly requested)

#### g) Per-path DVN configuration (if specified in question 8)

When the user provides per-path DVN overrides, add them to **both** `creditMessaging` and `tokenMessaging` blocks for the new chain. The structure mirrors the `requiredDVNs` pattern but is scoped to specific destination chains:

```ts
[EndpointId.<CHAIN>_V2_MAINNET]: {
    creditMessaging: {
        ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        requiredDVNs: [DVNS.NETHERMIND[EndpointId.<CHAIN>_V2_MAINNET], DVNS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET]],
        perPathRequiredDVNs: {
            [EndpointId.<TARGET>_V2_MAINNET]: [DVNS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET]],
        },
        perPathOptionalDVNs: {
            [EndpointId.<TARGET>_V2_MAINNET]: [
                DVNS.NETHERMIND[EndpointId.<CHAIN>_V2_MAINNET],
                DVNS.BERA[EndpointId.<CHAIN>_V2_MAINNET],
                // ... other optional DVNs
            ],
        },
        perPathOptionalDVNsThreshold: {
            [EndpointId.<TARGET>_V2_MAINNET]: 2,
        },
        executor: EXECUTORS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET],
    },
    tokenMessaging: {
        // Same perPath structure as creditMessaging
        ...
    },
    ...
},
```

**Bidirectional config**: If the user indicated bidirectional (usually yes), also update the **target chain's** existing NETWORKS_CONFIG entry to add matching perPath config pointing back to the new chain. For example, if adding bera with per-path config for ethereum, also update ethereum's entry:

```ts
// In the EXISTING ethereum entry, add to creditMessaging and tokenMessaging:
perPathRequiredDVNs: {
    [EndpointId.<CHAIN>_V2_MAINNET]: [DVNS.LZ_LABS[EndpointId.ETHEREUM_V2_MAINNET]],
},
perPathOptionalDVNs: {
    [EndpointId.<CHAIN>_V2_MAINNET]: [
        DVNS.NETHERMIND[EndpointId.ETHEREUM_V2_MAINNET],
        DVNS.BERA[EndpointId.ETHEREUM_V2_MAINNET],
        // ... matching optional DVNs but using ETHEREUM's addresses
    ],
},
perPathOptionalDVNsThreshold: {
    [EndpointId.<CHAIN>_V2_MAINNET]: 2,
},
```

Note the addresses: the new chain's perPath config uses `[EndpointId.<CHAIN>_V2_MAINNET]` addresses (its own DVNs), while the target chain's perPath config uses `[EndpointId.<TARGET>_V2_MAINNET]` addresses (its own DVNs). Each chain references its own local DVN deployment.

### File 2: `packages/stg-evm-v2/hardhat.config.ts`

Add in the `// Mainnet` section, **alphabetical order** within the existing entries:

```ts
'<chain>-mainnet': {
    eid: EndpointId.<CHAIN>_V2_MAINNET,
    url: process.env.RPC_URL_<CHAIN_UPPER>_MAINNET || '<public-rpc-url>',
    accounts: mainnetAccounts,
    oneSigConfig: getOneSigConfig(EndpointId.<CHAIN>_V2_MAINNET),
    timeout: DEFAULT_NETWORK_TIMEOUT,
},
```

For the public RPC fallback URL: fetch a default RPC from `https://chainid.network/chains.json` (filter by `chainId` matching the nativeChainId). Use the first HTTPS RPC from the `rpc` array. If unavailable, use an empty string and note the user should add one.

Add extra flags if specified by user (e.g. `zksync: true`, `useFeeData: true`).

### File 3: `packages/stg-evm-v2/devtools/config/mainnet/01/chainsConfig/<chain>-mainnet.yml`

Create a new file. Only include sections for deployed assets:

```yaml
name: <chain>-mainnet
eid: <CHAIN>_V2_MAINNET
token_messaging: true
credit_messaging: true
tokens:
  eth:
    type: <native|pool|oft>
  usdc:
    type: <pool|oft>
treasurer:
  tokens:
    eth: true
    usdc: true
```

If the user specified rewarder config, add:
```yaml
rewarder:
  tokens:
    <reward-token>:
      allocation:
        <asset>: <amount>
```

If the user specified staking, add:
```yaml
staking:
  tokens:
    <asset>: true
```

---

## Phase 4 — Post-generation checklist

After all edits are applied, present this checklist:

- [ ] EndpointId `<CHAIN>_V2_MAINNET` exists in `@layerzerolabs/lz-definitions`
- [ ] Nethermind DVN address confirmed (request via Telegram if not in API)
- [ ] LZ Labs DVN address confirmed
- [ ] **nativeDropAmount confirmed with Angus** (gas_price * 500K * 3, native token has `<decimals>` decimals)
- [ ] OneSig address confirmed with team
- [ ] Token addresses confirmed (USDC.e, EURC.e deployed if needed)
- [ ] `RPC_URL_<CHAIN_UPPER>_MAINNET` set in `.env.local`
- [ ] Run `pnpm build` before deploying (picks up `stg-definitions-v2` changes)
- [ ] Deploy tokens first if needed (USDC.e via [stablecoin-evm](https://github.com/LayerZero-Labs/stablecoin-evm/tree/stargate-deployment))
- [ ] After deploy: ownership transfer (`make transfer-mainnet`) **before** wiring with funds
- [ ] PR includes changesets for all modified packages
- [ ] If per-path DVNs were configured, verify bidirectional config is correct in both chains

---

## Phase 5 — Deployment commands guide

Once the user confirms the checklist is clear, guide them through the deployment steps in order. Present each command and wait for confirmation before suggesting the next.

### Step 1: Build

```bash
pnpm build
```
This picks up the `stg-definitions-v2` changes you just made.

### Step 2: Deploy contracts

```bash
make deploy-mainnet DEPLOY_ARGS_COMMON="--ci"
```
The `--ci` flag skips interactive prompts. Confirm the deployer wallet has sufficient funds before running.

### Step 3: Verify contracts

```bash
cd packages/stg-evm-v2
npx @layerzerolabs/verify-contract --network <chain-name> -k <etherscan-key> --api-url <explorer-api>
```
Ask the user for the explorer API URL and etherscan key if not already in env.

### Step 4: Preconfigure (deployer hot wallet)

```bash
make preconfigure-mainnet CONFIGURE_ARGS_COMMON=--ci
```
This configures OFTs, Circle token minters (USDC/EURC), and TIP-20 tokens. Must run **before** transferring ownership since it uses deployer roles.

### Step 5: Transfer ownership

```bash
make transfer-mainnet CONFIGURE_ARGS_COMMON=--ci
```
Transfers ownership of all deployed contracts to OneSig. **This must complete before wiring the chain to the mesh with funds** — otherwise a compromised deployer wallet could access mesh funds.

### Step 6: Dry-run configuration

```bash
make configure-mainnet CONFIGURE_ARGS_COMMON="--ci --dry-run"
```
Validates all transactions would succeed without broadcasting. Use this to catch config errors before wiring with multisig.

### Step 7: Configure via OneSig

Set the `NEW_CHAIN` environment variable so only paths involving the new chain are wired:

```bash
export NEW_CHAIN=<chain-name>
make configure-mainnet CONFIGURE_ARGS_COMMON="--onesig"
```
Add `--ci` to skip interactive prompts. Each transaction is proposed for OneSig approval.

### Step 8: Post-deployment

Remind the user to:
1. **Finalize the PR** — config + deployment artifacts in the same PR, include changesets for all packages
2. **Publish packages** — check and merge the "Version packages" PR from stargate-bot
3. **Run the offchain checker** — via [GitHub Action](https://github.com/stargate-protocol/stargate-v2/actions/workflows/offchain-checker.yaml) or locally to verify LayerZero and Stargate configurations. Most common failure is executor native cap being too low — notify Caleb if so.

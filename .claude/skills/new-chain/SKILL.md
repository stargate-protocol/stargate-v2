---
name: new-chain
argument-hint: "[chain-name]"
description: >
  Configure a new chain deployment for Stargate V2. Use this skill whenever someone
  mentions deploying Stargate to a new chain, adding a new chain to the mesh, setting up
  chain configuration, or running /new-chain. It auto-fetches EndpointId, chain ID,
  DVN addresses, and executor from LayerZero APIs, calculates nativeDropAmount via
  cast gas-price, and generates all required config files (constant.ts, hardhat.config.ts,
  chain YAML). Trigger even if the user just says "add <chain>" or "deploy to <chain>".
  IMPORTANT: Always ask the user for confirmation before proceeding with the skill.
---

# Stargate V2 — New Chain Configuration & Deployment

You are helping configure and deploy a new chain for Stargate V2. The flow is:
1. Ask the user for the info you need upfront (in a single message)
2. Auto-fetch everything possible from LayerZero APIs + calculate nativeDropAmount
3. Generate all 3 config files
4. Present follow-up checklist for deployment

The chain name is passed as an argument: `/new-chain <chain-name>` (e.g. `/new-chain sonic`).
If no argument was given, ask for the chain name before doing anything else.

---

## Step 1 — Ask for info upfront

In a **single message**, tell the user you're about to configure `<chain-name>` and ask for everything you need before proceeding. This avoids multiple back-and-forth exchanges. The OneSig URL slug defaults to the chain name — don't ask for it.

Example message:

> I'll configure `<chain-name>` for Stargate V2. Before I fetch data and generate the config files, I need:
>
> 1. **OneSig address** — multisig address for ownership transfer
> 2. **Assets** — which assets to deploy and their type (`<asset>: native|pool <address>|oft`)
> 3. **Custom config** — any extra hardhat flags, additional DVNs, rewarder/staking, or per-path DVN overrides? ("none" if nothing)
>
> Once you provide these, I'll fetch the chain data from LayerZero APIs, calculate the nativeDropAmount, and generate all config files.

Asset types:
- `native` — for ETH on native L2s
- `pool <address>` — token already exists on chain
- `oft` — Stargate deploys its bridged version
- Supported assets: `eth`, `usdc`, `usdt` (rare — USDT0 is canonical), `eurc`

Custom config options (only if user asks):
- Extra hardhat flags: `zksync: true`, `useFeeData: true`, `isTIP20: true`, `alt: true`, `ethNetwork: '<network>'`
- Additional DVNs beyond Nethermind + LZ Labs (e.g. BERA, EIGEN_ZERO) — provide name + address
- Rewarder/Staking config — which tokens and reward token allocations
- Per-path DVN overrides — see per-path section below

Wait for the user's answers before proceeding.

### Per-path DVN overrides (if needed)

This is used when specific paths (e.g. to/from Ethereum) require different DVN setups than the default. For each path, the user provides:
- Target chain (e.g. `ethereum`)
- `perPathRequiredDVNs`: which DVNs are required for that path
- `perPathOptionalDVNs`: which DVNs are optional for that path
- `perPathOptionalDVNsThreshold`: how many optional DVNs must verify (e.g. `2`)
- Whether the remote chain also needs matching per-path config back (usually yes — bidirectional)

Example (bera ↔ ethereum):
```
Path: ethereum
perPathRequiredDVNs: [LZ_LABS]
perPathOptionalDVNs: [NETHERMIND, BERA, USDT0, CANARY]
perPathOptionalDVNsThreshold: 2
Bidirectional: yes
```

---

## Step 2 — Auto-fetch chain data and generate config

Once the user provides their answers, fetch all data **in parallel** and then immediately generate the config files — no need to stop and show the fetched data separately.

### 2a. Deployments API

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

### 2b. DVN API

```
GET https://metadata.layerzero-api.com/v1/metadata/dvns?chainNames=<chain-name>
```

From the DVN map for the chain, extract addresses (the map keys) for:
- **Nethermind DVN**: entry with `id` containing "nethermind" or `canonicalName` containing "Nethermind"
- **LZ Labs DVN**: entry with `id` containing "layerzero-labs" or `canonicalName` containing "LayerZero Labs"

If a DVN is missing, mark it as `⚠ NOT FOUND — needs manual resolution` and leave a placeholder.

### 2c. Calculate nativeDropAmount

Always calculate automatically using the formula: `gas_price * 500_000 * 3`.

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

If RPC is not configured, try a public RPC for the chain (search chainid.network or use a well-known endpoint). Express the result as `parseEther('<value>').toBigInt()`, rounded to 1-4 significant figures (e.g. `parseEther('0.001')`, `parseEther('0.015')`).

### 2d. Generate configuration files

Once all data is fetched, immediately generate the 3 config files. Add `// TODO: Confirm` comments on values that need human verification (addresses, nativeDropAmount). Present each change clearly.

#### File 1: `packages/stg-definitions-v2/src/constant.ts`

Make these additions **in alphabetical order** within each block:

**a) DVNS.NETHERMIND**
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<nethermind-dvn-address>',
```

**b) DVNS.LZ_LABS**
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<lzlabs-dvn-address>',
```

**c) Additional DVN objects** — if the user specified extra DVNs, either add entries to existing objects or create new ones:
```ts
DVNNAME: {
    [EndpointId.<CHAIN>_V2_MAINNET]: '<address>',
} satisfies Partial<Record<EndpointId, string>>,
```

**d) EXECUTORS.LZ_LABS**
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<executor-address>',
```

**e) ASSETS** — per deployed asset:

For **ETH** (inside `ASSETS[TokenName.ETH].networks`):
- Native: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Native },`
- Pool: `[EndpointId.<CHAIN>_V2_MAINNET]: { symbol: 'WETH', name: 'WETH', type: StargateType.Pool, address: '<addr>' },`
- OFT: `[EndpointId.<CHAIN>_V2_MAINNET]: { symbol: 'WETH', name: 'WETH', type: StargateType.Oft },`

For **USDC** (inside `ASSETS[TokenName.USDC].networks`):
- Pool: `[EndpointId.<CHAIN>_V2_MAINNET]: { address: '<addr>', type: StargateType.Pool },`
- OFT with address: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Oft, address: '<addr>' },`
- OFT without address: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Oft },`

Same pattern for **USDT** and **EURC**.

**f) NETWORKS_CONFIG** — the main config block:
```ts
// TODO: Confirm OneSig address
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
        nativeDropAmount: parseEther('<X>').toBigInt(), // TODO: Confirm with Angus
    },
    oneSigConfig: {
        oneSigAddress: '<onesig-address>', // TODO: Confirm
        oneSigUrl: `${process.env.BASE_ONE_SIG_URL_MAINNET}/<chain-name>`,
    },
},
```

Variations:
- **No messaging**: omit `creditMessaging` and/or `tokenMessaging` (like blast-mainnet which has only oneSig)
- **Extra DVNs with per-path config**: see section below
- **Custom gas limits**: add `busGasLimit` and/or `nativeDropGasLimit` to tokenMessaging (only when explicitly requested)

**g) Per-path DVN configuration** (if requested) — add to **both** `creditMessaging` and `tokenMessaging`:

```ts
perPathRequiredDVNs: {
    [EndpointId.<TARGET>_V2_MAINNET]: [DVNS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET]],
},
perPathOptionalDVNs: {
    [EndpointId.<TARGET>_V2_MAINNET]: [
        DVNS.NETHERMIND[EndpointId.<CHAIN>_V2_MAINNET],
        DVNS.BERA[EndpointId.<CHAIN>_V2_MAINNET],
    ],
},
perPathOptionalDVNsThreshold: {
    [EndpointId.<TARGET>_V2_MAINNET]: 2,
},
```

If bidirectional (usually yes), also update the **target chain's** existing NETWORKS_CONFIG. Each chain references its own local DVN deployment addresses.

#### File 2: `packages/stg-evm-v2/hardhat.config.ts`

Add in the `// Mainnet` section, **alphabetical order**:

```ts
'<chain>-mainnet': {
    eid: EndpointId.<CHAIN>_V2_MAINNET,
    url: process.env.RPC_URL_<CHAIN_UPPER>_MAINNET || '<public-rpc-url>',
    accounts: mainnetAccounts,
    oneSigConfig: getOneSigConfig(EndpointId.<CHAIN>_V2_MAINNET),
    timeout: DEFAULT_NETWORK_TIMEOUT,
},
```

For the public RPC fallback: fetch from `https://chainid.network/chains.json` or use a well-known endpoint. Add extra flags if specified by user.

#### File 3: `packages/stg-evm-v2/devtools/config/mainnet/01/chainsConfig/<chain>-mainnet.yml`

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

Add `rewarder:` and `staking:` sections if the user requested them.

---

## Step 3 — Follow-up checklist

After all config files are generated, present the deployment checklist. Use checkboxes so the user can track progress.

```
## Follow-up checklist

### Before deploying
- [ ] Review generated config — confirm all addresses (OneSig, DVNs, tokens)
- [ ] Confirm nativeDropAmount with Angus (gas_price × 500K × 3)
- [ ] Set `RPC_URL_<CHAIN_UPPER>_MAINNET` in `.env.local`
- [ ] Deploy tokens first if needed (USDC.e via stablecoin-evm)
- [ ] If per-path DVNs configured, verify bidirectional config is correct

### Build and deploy
- [ ] `pnpm build`
- [ ] `make deploy-mainnet DEPLOY_ARGS_COMMON="--ci"`
- [ ] Verify contracts:
      `cd packages/stg-evm-v2 && npx @layerzerolabs/verify-contract --network <chain-name> -k <key> --api-url <url>`

### Create PR and get it reviewed
- [ ] Create PR with config + deployment artifacts (include changesets for all modified packages)
- [ ] Get PR reviewed and merged
- [ ] Check and merge the "Version packages" PR from stargate-bot

### Wire the chain to the mesh
- [ ] `make preconfigure-mainnet CONFIGURE_ARGS_COMMON=--ci`
- [ ] `make transfer-mainnet CONFIGURE_ARGS_COMMON=--ci`
- [ ] `NEW_CHAIN=<chain-name> make configure-mainnet CONFIGURE_ARGS_COMMON="--onesig --ci"`

### Post-deployment
- [ ] Run the offchain checker (GitHub Action) to verify configs
- [ ] If executor native cap is too low, notify Caleb
```

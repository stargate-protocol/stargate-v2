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
0. Create a branch `deployments/<chain-name>`
1. Ask the user for the info you need upfront (in a single message)
2. Auto-fetch everything possible from LayerZero APIs + calculate nativeDropAmount
3. Generate all 3 config files
4. Commit the changes and open a PR
5. Present follow-up checklist for deployment

The chain name is passed as an argument: `/new-chain <chain-name>` (e.g. `/new-chain sonic`).
If no argument was given, ask for the chain name before doing anything else.

---

## Step 0 — Create branch

Before asking for any info, create the branch:

```bash
git checkout -b deployments/<chain-name>
```

If the branch already exists, check it out instead. Confirm to the user that the branch is ready before continuing.

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

> ⚠️ **API truncation**: The deployments API response is very large and WebFetch may return a truncated version that cuts off newer chains. If the chain is not found in the response, the executor address is still reliable — look it up by using `chainKey: "<chain-name>", stage: "mainnet"` in the JSON. If you cannot retrieve it, note the address as a TODO and let the user know they can find it at:
> `https://metadata.layerzero-api.com/v1/metadata/deployments` → search for `"chainKey": "<chain-name>"`

The EndpointId constant follows the pattern `<CHAIN_UPPER>_V2_MAINNET` (e.g. `SONIC_V2_MAINNET` for eid 30332). Verify it exists by running:
```bash
grep '<CHAIN_UPPER>_V2_MAINNET' node_modules/@layerzerolabs/lz-definitions/dist/index.d.ts 2>/dev/null || echo "NOT_FOUND"
```

If `NOT_FOUND`, the constant is not yet in the installed package version. **Proceed anyway** using the constant name (e.g. `EndpointId.GENSYN_V2_MAINNET`) and add a note to the follow-up checklist that a package version bump is required before building.

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

If RPC is not configured, find a public RPC on **https://chainlist.org/** (search by chain name or chain ID). Express the result as `parseEther('<value>').toBigInt()`, rounded to 1-4 significant figures (e.g. `parseEther('0.001')`, `parseEther('0.015')`).

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
- OFT with known address: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Oft, address: '<addr>' },`
- OFT not yet deployed: always add a zero-address placeholder with a TODO — **never omit the `address` field**:
  ```ts
  [EndpointId.<CHAIN>_V2_MAINNET]: {
      type: StargateType.Oft,
      address: '0x0000000000000000000000000000000000000000', // TODO: Update with deployed USDC address on <Chain>
  },
  ```

Same pattern for **USDT** and **EURC** OFTs that haven't been deployed yet.

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
        nativeDropAmount: parseEther('<X>').toBigInt(), // TODO: Double check this value
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

## Step 4 — Commit and open PR

Once all config files are generated, stage and commit the changes, push the branch, and open a PR.

### Changeset

Create a changeset file at `.changeset/deploy-<chain-name>-<stage>.md` covering both modified packages:

```md
---
"@stargatefinance/stg-definitions-v2": patch
"@stargatefinance/stg-devtools-evm-hardhat-v2": patch
"@stargatefinance/stg-devtools-v2": patch
"@stargatefinance/stg-error-parser": patch
"@stargatefinance/stg-evm-sdk-v2": patch
"@stargatefinance/stg-evm-v2": patch
---

Configured and deployed <Chain Name> Mainnet
```

(Replace `Mainnet` with `Testnet` for testnet deployments.)

### Commit

Stage the config files and the changeset:
```bash
git add packages/stg-definitions-v2/src/constant.ts \
        packages/stg-evm-v2/hardhat.config.ts \
        packages/stg-evm-v2/devtools/config/mainnet/01/chainsConfig/<chain>-mainnet.yml \
        .changeset/deploy-<chain-name>-mainnet.md
git commit -m "feat: add <chain-name> mainnet config"
git push -u origin deployments/<chain-name>
```

### PR

Open the PR with `gh pr create` using this exact format:

**Title:** `📤 [deploy] <Chain Name> Mainnet` (or `Testnet` if it's a testnet deployment)
- `<Chain Name>` is the human-readable name, properly capitalised (e.g. `Gensyn`, `InjectiveEVM`, `Sonic`)

**Body:**
```
### In this PR:

Config for <Chain Name> Mainnet (<chain-id>) based on:
- <asset> - <type>
- <asset> - <type>

TODO:

- [ ] [caleb] Wire protocol for <chain-name>
- [ ] [ravina] Deploy <token description and link if known> (only include if there are OFT assets with a zero-address placeholder)
- [ ] [angus] confirm native drop amount
```

Rules for the TODO list — derive items directly from the `// TODO:` comments left in the generated code. Do not add any names or owners. Each TODO comment in the code becomes one PR checklist item:
- If any asset has `// TODO: Update with deployed <ASSET> address on <Chain>` → add `- [ ] Update <ASSET> address on <Chain Name> once deployed`
- If `nativeDropAmount` has `// TODO: Double check this value` → add `- [ ] Double check native drop amount value`
- Any other `// TODO:` comments in the generated files → include them as-is

Example `gh` command:
```bash
gh pr create \
  --title "📤 [deploy] <Chain Name> Mainnet" \
  --body "$(cat <<'EOF'
### In this PR:

Config for <Chain Name> Mainnet (<chain-id>) based on:
- <asset> - <type>

TODO:

- [ ] Update USDC address on <Chain Name> once deployed
- [ ] Double check native drop amount value
EOF
)"
```

Return the PR URL to the user once it is created.

---

## Step 5 — Follow-up checklist

After all config files are generated, present the deployment checklist. Use checkboxes so the user can track progress.

```
## Follow-up checklist

### Before deploying
- [ ] Review generated config — confirm all addresses (OneSig, DVNs, tokens)
- [ ] Double check nativeDropAmount with the team (gas_price × 500K × 3)
- [ ] Set `RPC_URL_<CHAIN_UPPER>_MAINNET` in `.env.local`
- [ ] If `EndpointId.<CHAIN>_V2_MAINNET` was NOT_FOUND in the package, bump `@layerzerolabs/lz-definitions` to a version that includes it before building
- [ ] Deploy tokens first if needed (OFT addresses from that deployment replace the zero-address placeholders in `constant.ts`)
- [ ] If per-path DVNs configured, verify bidirectional config is correct

### Build and deploy
- [ ] `pnpm build`
- [ ] `make deploy-mainnet DEPLOY_ARGS_COMMON="--ci"`
- [ ] Verify contracts:
      `cd packages/stg-evm-v2 && npx @layerzerolabs/verify-contract --network <chain-name> -k <key> --api-url <url>`

### Get PR reviewed and merged
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

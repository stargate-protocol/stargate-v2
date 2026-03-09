# Stargate V2 New Chain Configuration

You are helping configure a new chain deployment for Stargate V2. Your job is to auto-fetch as much data as possible and generate all required configuration changes.

## Step 0 — Parse input

The user invokes this as `/new-chain <chain-name>`, e.g. `/new-chain mychain`.

Extract `<chain-name>` from the arguments. If no argument was given, ask for the chain name before doing anything else.

---

## Step 1 — Fetch data from LZ APIs (do this in parallel)

### 1a. Deployments API
Fetch: `https://metadata.layerzero-api.com/v1/metadata/deployments`

Find the entry whose key matches `<chain-name>` (case-insensitive). Extract:
- `eid` from the v2 deployment entry (the one with `version: 2`)
- `nativeChainId` from `chainDetails.nativeChainId`
- `executor.address` from the v2 deployment entry — this is the LZ Labs Executor address
- `nativeCurrency.decimals` from `chainDetails.nativeCurrency.decimals` (usually 18, but verify)
- `nativeCurrency.symbol` from `chainDetails.nativeCurrency.symbol`

The EndpointId constant name follows the pattern `<CHAIN_UPPER>_V2_MAINNET`. Map the eid number to the constant name by looking at existing entries in `packages/stg-definitions-v2/src/constant.ts` — or derive it from context. Show the eid number; the user can confirm the constant name.

### 1b. DVN API
Fetch: `https://metadata.layerzero-api.com/v1/metadata/dvns?chainNames=<chain-name>`

From the returned DVN map for the chain, find:
- The entry whose `canonicalName` contains "Nethermind" (case-insensitive) → Nethermind DVN address (the map key)
- The entry whose `canonicalName` contains "LayerZero" or `id` is "lz-labs" or similar → LZ Labs DVN address (the map key)

If either DVN is not found in the API response, note it as "not yet deployed — to be requested from Nethermind team / LZ Labs" and leave it as a placeholder.

---

## Step 2 — Estimate nativeDropAmount

The formula is: `gas_price * 500_000 * 3` (result in wei, native token units).

To get gas price, run:
```bash
cast gas-price --rpc-url "$(RPC_URL_$(echo '<chain-name>' | tr '[:lower:]' '[:upper:]')_MAINNET)"
```

But since the env var may not be set, use the `getRpcUrl` helper logic: check `RPC_URL_<CHAIN_UPPER>_MAINNET` first, then fall back to `RPC_URL_MAINNET` template (replacing `CHAIN` with the chain name). Run this bash command to get the gas price:

```bash
# Try to resolve RPC from env
CHAIN_NAME="<chain-name>"
CHAIN_UPPER=$(echo "$CHAIN_NAME" | tr '[:lower:]' '[:upper:]')
RPC="${RPC_URL_${CHAIN_UPPER}_MAINNET:-}"

# If env var not set, check template
if [ -z "$RPC" ]; then
  TEMPLATE="${RPC_URL_MAINNET:-}"
  if [ -n "$TEMPLATE" ]; then
    RPC="${TEMPLATE//CHAIN/$CHAIN_NAME}"
  fi
fi

if [ -n "$RPC" ]; then
  cast gas-price --rpc-url "$RPC"
else
  echo "NO_RPC"
fi
```

If `NO_RPC` or `cast` is not installed, skip the gas price calculation and note that the user must confirm the `nativeDropAmount` manually with Angus using the formula: `gas_price * 500_000 * 3` (in wei, accounting for `nativeCurrency.decimals`).

If you do get a gas price (in wei), calculate:
- `suggested_wei = gas_price * 500_000 * 3`
- Convert to ether: `suggested_ether = suggested_wei / 1e18`
- Express as `parseEther('<suggested_ether>')` rounding to 4-6 significant figures

**Always flag**: "This is a suggestion — confirm with Angus before using."

---

## Step 3 — Present fetched data and ask for missing info

Show a summary of what was auto-fetched:

```
Chain: <chain-name>-mainnet
EndpointId eid: <eid>
EndpointId constant: <CHAIN>_V2_MAINNET  (please confirm)
Chain ID (nativeChainId): <chainId>
Native currency: <symbol> (<decimals> decimals)

LZ Labs Executor: <address>  ✓ fetched
LZ Labs DVN:      <address>  ✓ fetched  (or ⚠ not found)
Nethermind DVN:   <address>  ✓ fetched  (or ⚠ not found)

Suggested nativeDropAmount: parseEther('<X>').toBigInt()  ← confirm with Angus
```

Then ask the user for:

1. **OneSig address** — multisig address for ownership transfer
2. **OneSig URL slug** — path segment used in the OneSig URL (usually just `<chain-name>`)
3. **Safe address** — Gnosis Safe address (skip if the chain has no Safe)
4. **Safe URL slug** — path segment for Safe URL (usually just `<chain-name>`)
5. **Safe contractNetworks** — only if the chain does NOT use canonical Gnosis Safe contracts. If needed, provide chain ID + all 7 Safe contract addresses.
6. **Assets to deploy** — for each asset, specify type and address if applicable:
   - `eth`: `native` | `pool <address>` | `oft` (no address needed for native/oft)
   - `usdc`: `pool <address>` | `oft`
   - `usdt`: `pool <address>` | `oft` (rarely deployed now — USDT0 is canonical)
   - `eurc`: `pool <address>` | `oft`
   - Skip any asset not being deployed on this chain
7. **token_messaging / credit_messaging** — both true by default; ask if either should be false
8. **Extra hardhat flags** — e.g. `zksync: true`, `useFeeData: true`, `isTIP20: true`, `alt: true`, `ethNetwork: 'ethereum-mainnet'`
9. **Additional DVNs** — beyond Nethermind + LZ Labs (e.g. chain-specific DVNs like BERA, EIGEN_ZERO); provide name and address per endpoint if needed
10. **Confirmed nativeDropAmount** — accept the suggestion or provide override

---

## Step 4 — Generate configuration

Once all data is collected, generate ready-to-paste code blocks for each file. Show only the new additions with 2-3 lines of surrounding context for placement reference.

### File 1: `packages/stg-definitions-v2/src/constant.ts`

#### `DVNS.NETHERMIND` block — insert in alphabetical order:
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<nethermind-dvn-address>',
```

#### `DVNS.LZ_LABS` block — insert in alphabetical order:
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<lzlabs-dvn-address>',
```

#### `EXECUTORS.LZ_LABS` block — insert in alphabetical order:
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: '<executor-address>',
```

#### `ASSETS` blocks — one entry per deployed asset, in each asset's `networks` block:

ETH:
- Native: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Native },`
- Pool:   `[EndpointId.<CHAIN>_V2_MAINNET]: { symbol: 'WETH', name: 'WETH', type: StargateType.Pool, address: '<address>' },`
- OFT:    `[EndpointId.<CHAIN>_V2_MAINNET]: { symbol: 'WETH', name: 'WETH', type: StargateType.Oft },`

USDC / USDT / EURC:
- Pool: `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Pool, address: '<address>' },`
- OFT:  `[EndpointId.<CHAIN>_V2_MAINNET]: { type: StargateType.Oft },`

#### `NETWORKS_CONFIG` block — insert in alphabetical order:
```ts
[EndpointId.<CHAIN>_V2_MAINNET]: {
    creditMessaging: {
        ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        requiredDVNs: [
            DVNS.NETHERMIND[EndpointId.<CHAIN>_V2_MAINNET],
            DVNS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET],
        ],
        executor: EXECUTORS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET],
    },
    tokenMessaging: {
        ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
        requiredDVNs: [
            DVNS.NETHERMIND[EndpointId.<CHAIN>_V2_MAINNET],
            DVNS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET],
        ],
        executor: EXECUTORS.LZ_LABS[EndpointId.<CHAIN>_V2_MAINNET],
        nativeDropAmount: parseEther('<X>').toBigInt(),
    },
    oneSigConfig: {
        oneSigAddress: '<onesig-address>',
        oneSigUrl: `${process.env.BASE_ONE_SIG_URL_MAINNET}/<slug>`,
    },
    // include safeConfig only if a Safe address was provided:
    safeConfig: {
        safeAddress: '<safe-address>',
        safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/<slug>`,
        // include contractNetworks only if chain has non-canonical Safe contracts:
        contractNetworks: {
            [<chainId>]: {
                multiSendAddress: '...',
                multiSendCallOnlyAddress: '...',
                safeMasterCopyAddress: '...',
                safeProxyFactoryAddress: '...',
                fallbackHandlerAddress: '...',
                createCallAddress: '...',
                signMessageLibAddress: '...',
                simulateTxAccessorAddress: '...',
            },
        },
    },
},
```

Omit `creditMessaging` / `tokenMessaging` blocks if the chain does not support them.
Omit `safeConfig` if no Safe address was provided.

---

### File 2: `packages/stg-evm-v2/hardhat.config.ts`

Insert in the `// Mainnet` section in alphabetical order. Use `getRpcUrl` instead of a hardcoded URL:

```ts
'<chain>-mainnet': {
    eid: EndpointId.<CHAIN>_V2_MAINNET,
    url: getRpcUrl('<chain>-mainnet') ?? '',
    accounts: mainnetAccounts,
    safeConfig: getSafeConfig(EndpointId.<CHAIN>_V2_MAINNET),    // omit if no Safe
    oneSigConfig: getOneSigConfig(EndpointId.<CHAIN>_V2_MAINNET),
    timeout: DEFAULT_NETWORK_TIMEOUT,
    // add extra flags here if provided: zksync, useFeeData, isTIP20, alt, ethNetwork
},
```

---

### File 3: `packages/stg-evm-v2/devtools/config/mainnet/01/chainsConfig/<chain>-mainnet.yml`

Create a new file (do not overwrite existing). Include only sections that apply:

```yaml
name: <chain>-mainnet
eid: <CHAIN>_V2_MAINNET
token_messaging: true
credit_messaging: true
tokens:
  eth:
    type: native    # or pool or oft
  usdc:
    type: oft       # or pool
  # add usdt / eurc if deployed
treasurer:
  tokens:
    eth: true       # list only deployed tokens
    usdc: true
# only include rewarder / staking if applicable
```

---

## Step 5 — Post-generation checklist

After presenting all code blocks, show this checklist:

- [ ] Confirm EndpointId constant name `<CHAIN>_V2_MAINNET` exists in `@layerzerolabs/lz-definitions` (run `grep -r "<CHAIN>_V2_MAINNET" node_modules/@layerzerolabs/lz-definitions/` to verify)
- [ ] Nethermind DVN confirmed (request from Nethermind team via Telegram if not in API)
- [ ] LZ Labs DVN confirmed (check [DVN API](https://metadata.layerzero-api.com/v1/metadata/dvns?chainNames=<chain>))
- [ ] **nativeDropAmount confirmed with Angus** — formula: `gas_price * 500_000 * 3` (in wei, native token has `<decimals>` decimals)
- [ ] OneSig address confirmed
- [ ] Asset types and addresses confirmed (to be done separately)
- [ ] `RPC_URL_<CHAIN_UPPER>_MAINNET` set in `.env.local` before deploying
- [ ] Run `pnpm build` before `make deploy-mainnet` — required so `stg-definitions-v2` changes are reflected
- [ ] Deploy tokens first if needed (USDC.e via stablecoin-evm, USDT, EURC.e) before running Stargate deploy
- [ ] Ownership transfer (`make transfer-mainnet`) must complete **before** wiring the chain with funds
- [ ] PR includes changesets for all modified packages

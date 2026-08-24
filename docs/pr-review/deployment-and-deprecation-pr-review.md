# Deployment and Deprecation PR Review

Use this checklist only for Stargate V2 PRs labeled `new-chain` or
`deprecation`. If a PR is not labeled, use it when the title or changed files
clearly show a deployment or deprecation.

This is a PR review checklist for agents and humans, not an execution runbook.
Operational shutdown steps and transaction dry-runs are out of scope. Agents
perform every check below except those marked **Human**.

Jump to: [Deployment](#deployment-prs) · [Deprecation](#deprecation-prs) ·
[TL;DR for Humans](#tldr-for-humans)

## Deployment PRs

Deployment has two review parts. They may be in one PR or in separate PRs;
apply every section represented in the diff.

### 1. Configuration

Review `constant.ts`, `hardhat.config.ts`, the chain YAML, and the changeset.
If any configuration value is still a placeholder or has an unresolved
`TODO`, stop and report that the PR is not ready for review.

#### Addresses and network values

- Match DVNs to
  `https://metadata.layerzero-api.com/v1/metadata/dvns?chainNames=<chain>` and
  the executor to
  `https://metadata.layerzero-api.com/v1/metadata/deployments`. Reusing the
  same valid address on multiple chains is allowed.
- Require non-zero token and OneSig addresses with non-empty contract
  code. Do not use LayerZero metadata to identify a token or OneSig.
- Match each asset type (`Native`, `Pool`, or `Oft`) between `constant.ts` and
  the chain YAML.
- Check `nativeDropAmount` against `gas_price * 500_000 * 3` and the executor
  native cap. Treat zero or unusually large values as questions to resolve,
  not automatic defects when the PR documents a deliberate limit.
- A per-path DVN override under chain A for chain B configures only A → B. If
  the PR intends the same policy for B → A, require the reciprocal override
  under chain B. Do not require it for an intentionally one-way policy.

**Human:** Verify the token contract on the chain explorer and confirm its
proxy admin address is the configured OneSig address.

#### Cross-file consistency

- Use the same `EndpointId` in `constant.ts`, `hardhat.config.ts`, and the
  chain YAML.
- Require a real RPC URL in `hardhat.config.ts`.
- Require the chain YAML to contain the intended tokens and an active status.
- Keep new entries in the repository's existing order.

#### Configuration completeness

- Include a patch changeset for the packages changed by a standard deployment.

### 2. Contract deployment

This part adds only a new
`packages/stg-evm-v2/deployments/<chain>/` folder.

- Match the folder name and `.chainId` to the configured network.
- Require valid deployment JSON for the contracts expected by that chain and
  its configured assets.
- Require every recorded contract address to be non-zero and to have on-chain
  code.
- Do not overwrite an existing chain deployment or include unrelated files.

### Shared PR completeness

- Use title `📤 [deploy] <Chain> Mainnet|Testnet` and label `new-chain`.
- Require relevant CI checks to pass or a clear explanation in the PR.

## Deprecation PRs

First identify whether the PR is a full-chain shutdown, a shutdown phase, or
an asset-only unwire. The title, description, and diff must agree on scope.

### Chain or phase deprecation

- Set `status: DEPRECATED` before applying chain-level unwire configuration.
- Match messaging directions to the requested phase:

  | Chain type | Phase | TokenMessaging | CreditMessaging |
  |---|---|---|---|
  | Pool | Step 1 | `from` | `both` |
  | Pool | Step 2 / full | `both` | `both` |
  | Hydra/OFT | Phase 1 | `to` | `both` |
  | Hydra/OFT | Phase 2 / full | `both` | `both` |

- For a full shutdown, allow only the deprecated chain itself in
  `allowed_peers`.
- Allow `chain_shutdown: true` only for a dead RPC and only with
  `status: DEPRECATED` plus `direction: both`.
- Add the EID to `messaging.disconnected-check.yml` in the final-disconnect PR.
- Do not remove `constant.ts`, Hardhat, deployment, or OneSig config
  before the PR provides evidence that the disconnected checker passed.

### Asset-only deprecation

- Do not change chain status, chain-level messaging, Hardhat, or OneSig
  configuration.
- Move only the deprecated asset from `tokens` to `unwired_tokens` and change
  only its matching asset entries in `constant.ts`.
- Ensure assets remaining on the chain stay configured.

### PR completeness

- Use title `🛑 [shutdown] <Chain(s)> mainnet[, Phase N]` and label
  `deprecation`.
- Include a major changeset for packages that lose a chain or asset.
- Require relevant config CI checks to pass or a clear explanation in the PR.

Report only concrete, actionable findings with a file and line. If a value
cannot be verified, say so instead of guessing.

## TL;DR for Humans

### Deployment

1. **`constant.ts`** — check DVNs and executor against LayerZero metadata;
   check token and OneSig addresses have code and verify both on the explorer;
   check asset type, `nativeDropAmount`, per-path DVNs, and that no placeholder
   or `TODO` remains.
2. **`hardhat.config.ts`** — check the network name, `EndpointId`, and RPC URL.
3. **Chain YAML** — check the name, `EndpointId`, active status, messaging
   flags, tokens, and asset types match `constant.ts`.
4. **`deployments/<chain>/`** — if present, check `.chainId`, expected contract
   JSON files, and deployed addresses. If absent, expect it in a follow-up
   deployment PR.

### Deprecation

1. **`constant.ts`** — in the final cleanup PR, check every deprecated chain
   or asset entry is removed. Before the disconnected check passes, those
   entries must remain.
2. **`hardhat.config.ts`** — remove the network only in the final chain cleanup;
   never remove it for an asset-only deprecation.
3. **`deployments/<chain>/`** — keep the deployment folder unchanged.
4. **Chain YAML** — check `status`, unwire directions, `allowed_peers`, and
   asset moves match the deprecation type and phase.
5. **`messaging.disconnected-check.yml`** — add the deprecated EID in the
   final-disconnect PR, before removing `constant.ts` or Hardhat entries.

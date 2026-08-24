# Agent instructions

## Reviewing config-deployment and deprecation/shutdown PRs

When asked to review a pull request in this repository that is labeled
`new-chain` or `deprecation`, or — if unlabeled — either:

- adds or changes chain configuration deployment values (title convention
  `📤 [deploy] <Chain> Mainnet|Testnet`; touches
  `packages/stg-definitions-v2/src/constant.ts`,
  `packages/stg-evm-v2/hardhat.config.ts`, or
  `packages/stg-evm-v2/devtools/config/**/chainsConfig/**`) or adds a new
  `packages/stg-evm-v2/deployments/<chain>/` folder, or
- deprecates/shuts down a chain or asset (title convention
  `🛑 [shutdown] <Chain(s)> mainnet[, Phase N]`; sets `status: DEPRECATED`,
  adds/edits an `unwire:` block, or appends to
  `.../chainsConfig/unwire/messaging.disconnected-check.yml`),

follow the checklist in
[docs/pr-review/deployment-and-deprecation-pr-review.md](docs/pr-review/deployment-and-deprecation-pr-review.md)
file by file, in the order listed there. That doc is the single source of
truth for this review — it is also used by Claude and GitHub Copilot, so
keep findings consistent with it rather than improvising a different bar.

Keep the review limited to the deployment or deprecation PR checklist; do not
import operational runbook requirements that are not listed there.

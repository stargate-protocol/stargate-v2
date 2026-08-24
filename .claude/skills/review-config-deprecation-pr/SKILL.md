---
name: review-config-deprecation-pr
description: >
  Review Stargate V2 pull requests that add/change chain configuration, add a
  generated chain deployment folder, or deprecate/shut down a chain or asset
  (status: DEPRECATED, unwire config, disconnected-checker). Use when asked to
  review a PR, PR URL/number, branch, or diff labeled "new-chain" or
  "deprecation" on GitHub, or whose title matches "📤 [deploy] ..." or
  "🛑 [shutdown] ...", or that touches
  packages/stg-definitions-v2/src/constant.ts, packages/stg-evm-v2/hardhat.config.ts,
  packages/stg-evm-v2/devtools/config/**/chainsConfig/**, or
  packages/stg-evm-v2/deployments/**. Do not use for other kinds of PRs.
---

# Review: Config Deployment & Deprecation PRs

The checklist lives in
[docs/pr-review/deployment-and-deprecation-pr-review.md](../../../docs/pr-review/deployment-and-deprecation-pr-review.md) —
read it in full before reviewing; it is the source of truth, kept in sync for
Claude, Codex, Copilot, and human reviewers alike. This file only says how to
apply it.

## Steps

1. Get the diff: prefer `gh pr diff <number>`. For a local comparison, read
   the PR's actual `baseRefName` and use `git diff <pr-base>...<branch>`; never
   assume the base is `main`. Use the working-tree diff when reviewing local
   changes that do not have a PR.
2. Classify the PR: check its GitHub labels first (`new-chain` /
   `deprecation`), falling back to title emoji and which files changed if
   unlabeled. Within deprecation, further distinguish full-chain
   deprecation, asset-only unwire, or a phase (e.g. Hydra phase 1 vs phase
   2). Within deployment, distinguish configuration, contract deployment, or
   a PR containing both. Mixed PRs get every applicable checklist section.
3. For a configuration deployment PR, apply the checklist's readiness gate
   first. Stop if the configuration contains a placeholder or unresolved
   `TODO`.
4. Work through the matching section of the doc above, file by file, in the
   order listed there.
5. Do not import execution-runbook requirements that are absent from the PR
   checklist.
6. Report findings the normal way for this surface — inline PR comments with
   file + line, what's wrong, and what the correct value/state should be.
   If a value can't be verified from available data, say so explicitly and
   ask the author; do not guess or invent a finding.

If this file and the doc ever disagree, the doc wins — update this file to
match rather than the reverse.

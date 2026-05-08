---
name: pull
description: Sync a Stargate v2 working branch from origin/main before implementation or handoff.
---

# Pull

Use this workflow before editing in Symphony and again before handoff.

## Steps

1. Inspect `git status --short` and note local changes.
2. Fetch `origin`.
3. Merge `origin/main` into the current branch unless the branch already follows another documented base.
4. Resolve conflicts by preserving the ticket's intended changes and unrelated user work.
5. Run targeted validation when conflicts touched code, config, generated data, or tests.
6. Record the merge source, result, and new `HEAD` short SHA.

## Rules

- Prefer merge over rebase for unattended work unless the issue or maintainer asks for a rebase.
- Do not discard local changes to make the merge easier.
- If auth or network access blocks the sync, document the blocker and continue only when the work can still be validated safely.

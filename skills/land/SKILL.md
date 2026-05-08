---
name: land
description: Merge an approved Stargate v2 PR after validation, checks, and feedback are clear.
---

# Land

Use this workflow only when the PR is approved and the Linear issue is in `Merging`, or when a maintainer explicitly asks to land the PR.

## Preconditions

- PR is open and targets `main`.
- Human review approval is present or the maintainer explicitly authorized merge.
- Latest branch validation has passed.
- No actionable PR comments, review comments, bot feedback, or failing checks remain.

## Loop

1. Re-run `skills/pull/SKILL.md` to merge latest `origin/main`.
2. Resolve conflicts, then re-run the relevant validation from `docs/02-TESTING.md`.
3. Push the branch.
4. Check GitHub review state, inline comments, top-level comments, and CI.
5. Address any new feedback or failures, then repeat.
6. Merge using the repository's configured merge method.
7. Move the Linear issue to `Done` with `skills/linear/SKILL.md`.

## Rules

- Do not merge with unresolved human feedback.
- Do not bypass required checks.
- If GitHub auth or branch protection blocks merge, document the exact blocker in Linear and stop.

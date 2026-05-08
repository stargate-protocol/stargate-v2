---
name: push
description: Publish a Stargate v2 branch and open or update a GitHub PR.
---

# Push

Use this workflow after the branch has a clean commit and validation evidence.

## Steps

1. Confirm `git status --short` contains no unintended staged or unstaged changes.
2. Run the validation selected from `docs/02-TESTING.md`.
3. Push the current branch to the working remote.
4. Open or update a PR against `main`.
5. Use `.github/pull_request_template.md` when creating or refreshing the PR body.
6. Add the `symphony` label when the PR came from Symphony.
7. Attach the PR to the Linear issue with `skills/linear/SKILL.md` when `linear_graphql` is available.
8. Record the PR URL, commit SHA, and validation result in the workpad.

## PR Body Minimum

- Summary of user-visible or protocol-visible changes.
- Validation commands and results.
- Deployment/config notes when OApps, credit, chain definitions, OneSig, or legacy Safe behavior are touched.

## Rules

- Do not force-push unless rewriting this branch is explicitly part of the workflow.
- Do not move an issue to `Human Review` while checks are failing or actionable review feedback is unresolved.

---
name: commit
description: Create focused commits for Stargate v2 work without staging unrelated user changes.
---

# Commit

Use this workflow when a task is ready to be committed.

## Steps

1. Inspect `git status --short`.
2. Review the diff for every file you plan to stage.
3. Leave unrelated user changes unstaged.
4. Run the narrow validation required by `docs/02-TESTING.md`.
5. Stage only the intended files.
6. Commit with a short imperative subject and useful body when the change is non-obvious.
7. Record the commit SHA and validation result in the workpad or final response.

## Rules

- Do not amend, squash, reset, or clean unless the user or workflow explicitly asks.
- Do not stage generated outputs unless they are required and were produced by the normal scripts.
- For deployment/config changes, mention whether OneSig, legacy Safe, OApp wiring, or credit paths were affected.

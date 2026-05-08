# Skills

Shared task workflows live here so Codex, Claude, Copilot context, and Symphony can point at the same instructions.

- `new-chain`: add a chain or asset to Stargate v2.
- `pull`: sync a working branch from `origin/main`.
- `commit`: produce focused commits without staging unrelated work.
- `push`: publish a branch and open or update a PR.
- `land`: merge an approved PR after checks and review feedback are clear.
- `linear`: use Symphony's `linear_graphql` tool for issue comments, status changes, and PR attachments.

Claude wrappers in `.claude/skills` should stay small and point back to these canonical workflows.

# Claude Guide

Use the shared repo docs as the source of truth:

- `README.md` for the project entry point.
- `ARCHITECTURE.md` for package and protocol boundaries.
- `AGENTS.md` for agent workflow, commands, and guardrails.
- `docs/` for focused workflow maps.
- `skills/` for shared task workflows.
- `WORKFLOW.md` and `docs/07-SYMPHONY.md` for Symphony automation.

Claude-specific skill wrappers live under `.claude/skills`. Those wrappers point to canonical shared workflows in `skills/`; for new-chain deployment/configuration work, read `skills/new-chain/SKILL.md`.

Keep this file short. Add durable knowledge to the shared docs above, not here, unless it is specific to Claude behavior.

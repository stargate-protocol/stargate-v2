# Symphony

This repository is prepared for the prototype Symphony runner from `openai/symphony`.

## Files

- `WORKFLOW.md` is the Symphony workflow contract and Codex prompt.
- `skills/commit`, `skills/pull`, `skills/push`, `skills/land`, and `skills/linear` are repo-local workflows used by Symphony agents.
- `.claude/skills/*` contains wrappers that point Claude to the shared `skills/` workflows.

## Setup

1. Create a Linear personal API key and export `LINEAR_API_KEY`.
2. Confirm `WORKFLOW.md` points at the intended Linear `project_slug`.
3. Install and run Symphony from the upstream repository:

```shell
git clone https://github.com/openai/symphony
cd symphony/elixir
mise trust
mise install
mise exec -- mix setup
mise exec -- mix build
mise exec -- ./bin/symphony \
  --i-understand-that-this-will-be-running-without-the-usual-guardrails \
  /path/to/stargate-v2/WORKFLOW.md \
  --port 4000
```

## Local Choices

- Workspaces are created under `~/code/stargate-v2-symphony-workspaces`.
- New workspaces clone `git@github.com:clauBv23/stargate-v2.git` for testing.
- Agents use Codex app-server with `workspace-write` sandboxing and no approval prompts.
- Keep Linear statuses aligned with `WORKFLOW.md`: `Todo`, `In Progress`, `Rework`, `Human Review`, `Merging`, and terminal states.

---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  # project_slug: "contracts-a1be6c60e96d"
  project_slug: "contracts-42d37ebdeddf"
  active_states:
    - Todo
    - In Progress
    - Merging
    - Rework
  terminal_states:
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
    - Done
polling:
  interval_ms: 5000
workspace:
  root: ~/code/stargate-v2-symphony-workspaces
hooks:
  after_create: |
    git clone --depth 1 git@github.com:clauBv23/stargate-v2.git .
    if command -v corepack >/dev/null 2>&1; then
      corepack enable
    fi
    if command -v pnpm >/dev/null 2>&1; then
      pnpm install --frozen-lockfile --prefer-offline || pnpm install --frozen-lockfile
    elif command -v corepack >/dev/null 2>&1; then
      corepack pnpm install --frozen-lockfile --prefer-offline || corepack pnpm install --frozen-lockfile
    else
      echo "pnpm not found; install dependencies before running validation"
    fi
external_access:
  enabled: true
  allowed_http_urls:
    - https://metadata.layerzero-api.com/v1/metadata/deployments
    - https://metadata.layerzero-api.com/v1/metadata/dvns
    - https://chainid.network/chains.json
  allowed_commands:
    - command: cast
      executable: ~/.foundry/bin/cast
      args:
        - gas-price
        - --rpc-url
        - "<public_https_url>"
github_publisher:
  enabled: true
  repo: clauBv23/stargate-v2
  origin: git@github.com:clauBv23/stargate-v2.git
  base_branch: main
  branch_prefix: symphony/
  denied_path_segments:
    - artifacts
    - artifacts-zk
    - cache
    - deployed
    - deployments
    - deployments-zk
    - dist
    - node_modules
    - out
    - typechain-types
  allowed_paths:
    - .changeset/
    - .claude/
    - .github/
    - AGENTS.md
    - ARCHITECTURE.md
    - CLAUDE.md
    - LICENSE
    - Makefile
    - README.md
    - WORKFLOW.md
    - audits/
    - docs/
    - example.metadata.json
    - install-dependencies
    - package.json
    - packages/
    - patches/
    - pnpm-lock.yaml
    - pnpm-workspace.yaml
    - scripts/
    - skills/
    - tsconfig.json
    - turbo.json
agent:
  max_concurrent_agents: 1
  max_turns: 1
codex:
  command: /Applications/Codex.app/Contents/Resources/codex --config shell_environment_policy.inherit=all --config 'model="gpt-5.5"' --config model_reasoning_effort=medium app-server
  approval_policy: never
  thread_sandbox: workspace-write
---

You are working on Linear ticket `{{ issue.identifier }}` in the Stargate v2 repository.

{% if attempt %}
Continuation context:

- This is retry attempt #{{ attempt }} because the ticket is still active.
- Resume from the current workspace state. Do not restart investigation or validation unless new changes require it.
  {% endif %}

Issue context:

- Identifier: `{{ issue.identifier }}`
- Title: `{{ issue.title }}`
- Current status: `{{ issue.state }}`
- Labels: `{{ issue.labels }}`
- URL: `{{ issue.url }}`

Description:

{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

## Test-Mode Rules

- This is a low-token Symphony test run. Keep context small.
- Work only inside the provided repository copy.
- Read only the issue, target files, and one supporting doc when needed. Do not read `ARCHITECTURE.md`, `skills/`, contracts, generated outputs, or package internals unless the issue explicitly requires them.
- For docs-only tasks, inspect only the target doc plus `README.md` or `AGENTS.md` if needed for consistency.
- For new-chain deployment config PR tasks, read `skills/new-chain/SKILL.md` and use the issue description as the required input source.
- For new-chain metadata, use the `external_access` tool. Do not use shell `curl` for LayerZero/Chainlist metadata or shell `cast gas-price`.
- Make the smallest change that satisfies the acceptance criteria.
- Run the validation command from the issue. If none is provided for docs-only work, run `pnpm prettier --check <changed-md-files>`.
- Use the `github_publisher` tool for Git/GitHub work. Do not run shell `git commit`, `git push`, or `gh pr create`.
- Start one `symphony/` branch before editing if the issue needs a PR.
- Commit after validation using explicit changed paths. Use multiple commits when changes are logically separate.
- Push the branch and create the PR with `github_publisher`.
- Leave a concise Linear handoff note with the validation result and PR URL, then move the issue to `Human Review` if that status exists.
- Do not continue into extra cleanup, broad review, or unrelated improvements.

## Stargate Safety Reminders

- New deployments and new chains use OneSig; do not add new `safeConfig` entries.
- Do not hand-edit generated outputs.
- For OApp, credit, deployment, or protocol behavior changes, stop and read `ARCHITECTURE.md`, `AGENTS.md`, and the relevant `docs/` or `skills/` workflow before editing.

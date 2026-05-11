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
    - Deployed
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
    - https://metadata.layerzero-api.com/v1/metadata
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
    - command: pnpm
      working_directory: .
      allowed_states:
        - Deployed
      args:
        - --filter
        - "@stargatefinance/stg-definitions-v2"
        - build
    - command: pnpm
      working_directory: .
      allowed_states:
        - Deployed
      args:
        - --filter
        - "@stargatefinance/stg-devtools-v2"
        - build
    - command: pnpm
      working_directory: .
      allowed_states:
        - Deployed
      args:
        - --filter
        - "@stargatefinance/stg-devtools-evm-hardhat-v2"
        - build
    - command: pnpm
      working_directory: .
      allowed_states:
        - Deployed
      args:
        - --filter
        - "@stargatefinance/stg-evm-sdk-v2"
        - validate
    - command: pnpm
      working_directory: .
      allowed_states:
        - Deployed
      args:
        - --filter
        - "@stargatefinance/stg-evm-sdk-v2"
        - check:deployment
    - command: pnpm
      working_directory: packages/stg-evm-v2
      allowed_states:
        - Deployed
      args:
        - dlx
        - "@layerzerolabs/verify-contract"
        - --network
        - "<safe_slug>"
        - --api-url
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
- If the issue status is `Deployed`, do only post-deploy verification:
  - Do not edit deployment config.
  - Do not run deploy, preconfigure, configure, wire, transfer-ownership, or any command that signs or sends transactions.
  - Read the issue description and prior Linear comments for the chain name, PR/branch, explicit explorer API URL, explorer UI URL hints, and deployment notes.
  - SDK validation requires `RPC_URL_MAINNET` in the Symphony process environment. It should be the repo-supported LayerZero proxy RPC template that can serve every checked mainnet chain. Do not guess this value from Chainlist and do not write `.env.local` during post-deploy verification.
  - Run these `external_access` `command_run` build preflights in order to restore local workspace artifacts required by SDK checks:
    - `command: "pnpm"`, `args: ["--filter", "@stargatefinance/stg-definitions-v2", "build"]`
    - `command: "pnpm"`, `args: ["--filter", "@stargatefinance/stg-devtools-v2", "build"]`
    - `command: "pnpm"`, `args: ["--filter", "@stargatefinance/stg-devtools-evm-hardhat-v2", "build"]`
  - Run `external_access` `command_run` with `command: "pnpm"` and `args: ["--filter", "@stargatefinance/stg-evm-sdk-v2", "validate"]`. This is the SDK's documented post-deploy validation path and runs typechain setup, generated config refresh, and deployment checks.
  - If validation reports `No RPC URL found` or `No chains with valid RPC URLs found`, stop and leave a handoff note that Symphony must be restarted with `RPC_URL_MAINNET` set.
  - Do not hand-edit generated SDK config. If `validate` cannot generate `src/generated-configs` because network metadata is unavailable, leave a concise handoff note.
  - Use `check:deployment` only for a narrow rerun after `validate` has already restored generated config in the same workspace.
  - Resolve the explorer API URL before verification. Prefer an explicit public HTTPS API URL from the issue or comments. If missing, use `external_access` `http_get_json` for Chainlist, match the chain by chain name, human name, or chain ID, inspect `explorers`, and derive an API URL only when it is obvious, such as a Blockscout-compatible explorer URL plus `/api` or an API URL already present in metadata.
  - If the issue comments include only an explorer UI URL, or Chainlist does not include a usable explorer, use the UI URL as a hint and use `external_access` `http_get_json` for LayerZero deployments metadata, match `<chain>-mainnet` or the chain key plus stage, and inspect explorer fields such as `blockExplorers`. Treat URLs ending in UI routes like `/home` as explorer UI URLs, not API URLs; normalize to the explorer origin before deriving an API endpoint.
  - If no public HTTPS explorer API URL can be identified confidently, leave a concise Linear handoff note instead of guessing.
  - If an explorer API URL is available, run `external_access` `command_run` with `command: "pnpm"` and `args: ["dlx", "@layerzerolabs/verify-contract", "--network", "<chain-name>", "--api-url", "<explorer-api-url>"]`.
  - Leave a concise Linear comment with verification results. Move the issue to `Post-Deploy Review` if that status exists; otherwise move it to `Human Review` if that status exists so blocked or completed post-deploy checks leave active polling.
- Make the smallest change that satisfies the acceptance criteria.
- Run the validation command from the issue. If none is provided for docs-only work, run `pnpm prettier --check <changed-md-files>`.
- Use the `github_publisher` tool for Git/GitHub work. Do not run shell `git commit`, `git push`, or `gh pr create`.
- Start one `symphony/` branch before editing if the issue needs a PR.
- Commit after validation using explicit changed paths. Use multiple commits when changes are logically separate.
- Push the branch and create the PR with `github_publisher`.
- For non-`Deployed` tasks, leave a concise Linear handoff note with the validation result and PR URL, then move the issue to `Human Review` if that status exists.
- Do not continue into extra cleanup, broad review, or unrelated improvements.

## Stargate Safety Reminders

- New deployments and new chains use OneSig; do not add new `safeConfig` entries.
- Do not hand-edit generated outputs.
- For OApp, credit, deployment, or protocol behavior changes, stop and read `ARCHITECTURE.md`, `AGENTS.md`, and the relevant `docs/` or `skills/` workflow before editing.

# Copilot Code Review Instructions

Use the repository docs as context when reviewing PRs:

- `README.md` for the project entry point.
- `ARCHITECTURE.md` for package and protocol boundaries.
- `AGENTS.md` for agent workflow and guardrails.
- `WORKFLOW.md` for Symphony's unattended PR workflow.
- `docs/` for focused workflow maps.
- `skills/` for shared task workflows.

Focus review comments on correctness, security, deployment safety, and missing validation. Avoid style-only comments unless they hide a real bug or maintenance risk.

Important Stargate rules:

- `TokenMessaging` and `CreditMessaging` are the LayerZero OApps. Keep token delivery and credit allocation concerns separated.
- Credit is per-path send capacity in shared decimals. Sends consume credit; planner-driven credit messages rebalance path capacity.
- New deployments and new chains use OneSig only. Do not add `safeConfig` for new chains; Safe is legacy compatibility for chains that already support it.
- Do not hand-edit generated outputs such as `dist`, `out`, `cache`, `artifacts`, `artifacts-zk`, `deployed`, `deployments`, `deployments-zk`, or `ts-src/typechain-types` unless the PR explicitly documents why.
- For new-chain PRs, compare changes against `skills/new-chain/SKILL.md`.

Expected validation:

- Solidity protocol changes should include targeted Forge or Hardhat tests.
- Messaging, bus, credit, or fee changes should test relevant paths around `TokenMessaging`, `CreditMessaging`, `StargateBase`, or `FeeLibV1`.
- Deployment/config changes should keep definitions, devtools config, deployments, SDK generated data, and validation checks aligned.
- SDK/config changes should run the narrow package check or explain why it cannot run.

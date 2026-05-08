# Security

This file is a compact trust-boundary map. It is not an audit report.

## Roles

- Owner configures contracts, roles, paths, and protocol addresses.
- Planner controls liveness and path capacity through credit allocation, bus parameters, pausing, and pool targets.
- Treasurer controls treasury fee withdrawal, treasury funding, and supported token recovery.
- OneSig is the current multisig path for new deployments and new chains. Safe is legacy compatibility only.

## Boundaries

The planner is trusted for availability and rebalancing, not custody. It should not have a path to steal user funds.

Credit is per-path send capacity in shared decimals. Sends consume credit; credit messages rebalance capacity.

LayerZero OApp mechanics are isolated in `MessagingBase`, `TokenMessaging`, and `CreditMessaging`.

Generated artifacts should be regenerated through established scripts and checked before release.

## Review Focus

- Permission changes
- Credit accounting changes
- Token inflow/outflow changes
- Fee or reward changes
- Messaging encoding or routing changes
- Deployment/config changes that affect owners, planners, treasurers, peers, DVNs, or executors

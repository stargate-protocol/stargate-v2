---
"@stargatefinance/stg-devtools-evm-hardhat-v2": major
"@stargatefinance/stg-devtools-v2": major
"@stargatefinance/stg-definitions-v2": minor
"@stargatefinance/stg-evm-v2": minor
---

- Added `EURC` token support by introducing new contracts, deployment scripts, and configuration files following the existing `USDC` pattern.
- Refactored `USDC`-specific devtools to use a generic CircleFiatToken naming, enabling reuse across both `USDC` and `EURC`.

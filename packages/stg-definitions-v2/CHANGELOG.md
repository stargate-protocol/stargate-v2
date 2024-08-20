# @stargatefinance/stg-definitions-v2

## 1.1.9

### Patch Changes

- ed568bc: Update native drop gas limit to 20k
- 54f5da9: adjust metis bus ride limit

## 1.1.8

### Patch Changes

- 742431c: Add USDC & USDT pools (Sei & BNB)

## 1.1.7

### Patch Changes

- 19574c0: Update gas limits

## 1.1.6

### Patch Changes

- a0c734f: update gas limits with optimism
- 338d0dc: Update gas limits for bus: Base, Metis, Optimism

## 1.1.5

### Patch Changes

- 677404e: Add USDC & USDT pools (Sei & BNB)

## 1.1.4

### Patch Changes

- bbb57e3: Clean up order of constants

## 1.1.3

### Patch Changes

- 628ad50: Typoe in multisig configs

## 1.1.2

### Patch Changes

- 7c036ea: Update oft wrapper networks

## 1.1.1

### Patch Changes

- 8707395: Add support for flare
- b5bcc4c: Add Flare mainnet config

## 1.1.0

### Minor Changes

- c5c942c: Make Token & Credit Messaging configs optional in network configs

## 1.0.7

### Patch Changes

- 800dd33: Added support for Gravity

## 1.0.6

### Patch Changes

- 3e85be5: Updated to latest lz labs dependencies
- b8e04cb: Add existing networks to OFTWrapper config

## 1.0.5

### Patch Changes

- 01dc45c: Add OFTWrapper configuration constants & deploy script

## 1.0.4

### Patch Changes

- 771cca1: Update the taiko dvn

## 1.0.3

### Patch Changes

- 7ca5b2b: Fix Safe addresses for XChain

## 1.0.2

### Patch Changes

- 75816d2: Add SEI
- 75816d2: Add XCHAIN
- 75816d2: Add IOTA
- 75816d2: Add TAIKO

## 1.0.1

### Patch Changes

- 05a4cf8: Update @LayerZero-Labs dependencies

## 1.0.0

### Major Changes

- 2e28e41: Version 1.0.0. This version contains no breaking changes and has no implications for downstream projects.

## 0.3.24

### Patch Changes

- a771201: Updated @LayerZero-Labs dependencies

## 0.3.23

### Patch Changes

- f5a0eb6: Fix Rarible Safe URL
- f5a0eb6: Add Safe config for EBI and Rarible

## 0.3.22

### Patch Changes

- 78669cc: Update Base Gas Limits

## 0.3.21

### Patch Changes

- 8cf1d53: Angus accidently added stg as a reward token for opt and arb

## 0.3.20

### Patch Changes

- a79d331: Add rarible configuration

## 0.3.19

### Patch Changes

- 3992187: Move safe config into stg-definitions-v2

## 0.3.18

### Patch Changes

- f8b21e6: Mainnet V3

## 0.3.17

### Patch Changes

- 0063f29: Use USDC as a default name

## 0.3.16

### Patch Changes

- 3cc27f6: Only use USDC.e for USDC on scroll

## 0.3.15

### Patch Changes

- 08bd65f: Mainnet version 2 deployed and wired

## 0.3.14

### Patch Changes

- 61b8de6: Wire and enable metis and meth on ethereum

## 0.3.13

### Patch Changes

- ccd997b: Add getNetworkConfig utility; Make queueCapacity required on NetworkConfig

## 0.3.12

### Patch Changes

- ed17316: Fixes for deployment names

## 0.3.11

### Patch Changes

- e607567: STG address on zkSync

## 0.3.10

### Patch Changes

- aaf3a30: Add deployments for zk-sync

## 0.3.9

### Patch Changes

- 349ec78: Update to latest LZ package 2.3.10 and deploy/enable EBI
- 63323b4: Re-enable zkSync mainnet configuration

## 0.3.8

### Patch Changes

- 1f78d28: Add required DVNs to token & credit messaging configs
- 1f78d28: Drop naitveDrop default amount

## 0.3.7

### Patch Changes

- 41e1b9f: Mainnet v1 deployment

## 0.3.6

### Patch Changes

- 6d7ee45: Configure credit-messaging to use 40k gasLimit and 40k for MSG_TYPE=0

## 0.3.5

### Patch Changes

- b250ca4: Add ebi and comment out ethereum mainnet for now

## 0.3.4

### Patch Changes

- 9f00fac: Update lz-definitions dependencies

## 0.3.3

### Patch Changes

- 91feb8f: Update lz-definitions dependencies

## 0.3.2

### Patch Changes

- b0bdbc9: Add TokenMessaging config to stg-definitions-v2

## 0.3.1

### Patch Changes

- b2dbf3c: Updated to testnet v3

## 0.3.0

### Minor Changes

- 8197d58: Removed QueueCapacityConfig in favor of puting queueCapacity in NetworkConfig

## 0.2.5

### Patch Changes

- 8585652: Remove ETH asset from BSC sandbox

## 0.2.4

### Patch Changes

- 31004ee: Update @LayerZero-Labs dependencies

## 0.2.3

### Patch Changes

- 5d160b8: Drop unused constants

## 0.2.2

### Patch Changes

- af3c3a8: Adding setNativeDropAmount to token-messaging sdk

## 0.2.1

### Patch Changes

- e3eea38: Update @LayerZero-Labs dependencies

## 0.2.0

### Minor Changes

- 93ba7e2: Drop keys.json & rpcs.json

## 0.1.10

### Patch Changes

- 5c4fa08: Refactor gasLimit config in Token Messaging sdk

## 0.1.9

### Patch Changes

- acbfa59: Updating Kava USDT address

## 0.1.8

### Patch Changes

- afe0d5e: Updating Metis USDT symbol and updating Mantle USDC address

## 0.1.7

### Patch Changes

- 28f78e6: Mainnet USDC Token Config

## 0.1.6

### Patch Changes

- 0ac1507: Mainnet ETH Token Config
- 43304da: Mainnet USDT Token Config

## 0.1.5

### Patch Changes

- ab3b752: Adding 'METIS' and 'mETH' to token config

## 0.1.4

### Patch Changes

- 1e7f93a: Drop BelowZero

## 0.1.3

### Patch Changes

- f3fe359: Update constants for reward tokens

## 0.1.2

### Patch Changes

- 0bd2564: Update monorepo dependencies

## 0.1.1

### Patch Changes

- 24e9e02: Add missing constants to stg definitions for USDC, USDT, and Eth

## 0.1.0

### Minor Changes

- 6b523eb: Removing the BUSD and LUSD configurations and scripts

## 0.0.13

### Patch Changes

- 5cb4984: Add configurations to deploy and wire USDT on optimism-sepolia testnet

## 0.0.12

### Patch Changes

- 5ae58ce: Updated USDT ASSETS config to include testnet eid and address
- faaa7af: Add reward token configurations for sandbox

## 0.0.11

### Patch Changes

- f4e50f4: Rename `TokenNetworksConfig` and `TokenNetworkConfig`; Add `getAssetType`

## 0.0.10

### Patch Changes

- e8698db: Add AssetId type to stg-definitions-v2

## 0.0.9

### Patch Changes

- 8e7253d: Renamed TOKENS to ASSETS

## 0.0.8

### Patch Changes

- 5a67332: Making networks required in TokenConfig. Adding type to TokenNetworkConfig.

## 0.0.7

### Patch Changes

- c8e9dee: Add isTokenName assertion function

## 0.0.6

### Patch Changes

- 408e629: Update @LayerZero-Labs dependencies to 2.1.27

## 0.0.5

### Patch Changes

- 98a2d44: Add individual deploy scripts for tokens & assets
- 4a04c71: Move address configuration under TOKENS

## 0.0.4

### Patch Changes

- 100a226: Update nativeCap to match nativeDropAmount \* numPassengers

## 0.0.3

### Patch Changes

- a522327: Remove BSC from LUSD and ETH pools

## 0.0.2

### Patch Changes

- 0d1d70d: unique chain id and add new chain to localnet

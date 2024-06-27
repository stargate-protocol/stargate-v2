<p align="center">
  <a href="https://stargate.finance">
    <img src="https://stargate.finance/media/images/og-image.jpg"/>
  </a>
</p>

# Deployment & configuration

Stargate uses LayerZero [devtools](https://github.com/LayerZero-Labs/devtools) for deployment & configuration. It extends the provided `OApp` configuration capabilities with custom SDK & configuration for Stargate-specific functionality.

The individual commands required to deploy & configure Stargate have been clustered in `Makefile` in the root of the project for convenience.

The complete sequence of commands to be run by `make` for a specific target can be viewed by running `make` with `--dry-run` flag:

```bash
# To see what would happen if one wanted to deploy and configure testnet
make testnet --dry-run
```

## Snapshot

Snapshot images (containerized `geth` node with pre-deployed Stargate contracts) can be built using the supplied `Makefile`.

### Overview

Snapshot building flow consists of several consecutive actions, all based on `docker-compose.yaml` & `Dockerfile` in `stg-evm-v2` package.

### Prerequisites

AWS ECR login is required to pull/push the images from ECR:

```bash
export AWS_ACCESS_KEY_ID="ilovebigbugsandicantlie"
export AWS_SECRET_ACCESS_KEY="password1234nobodyexpects5"

docker login --username AWS --password $(aws ecr get-login-password --region us-east-1) 438003944538.dkr.ecr.us-east-1.amazonaws.com
```

### Recommended setup

Set the following environment variables for the fastest sandbox deployment experience:

```bash
LZ_ENABLE_EXPERIMENTAL_PARALLEL_EXECUTION=1
LZ_ENABLE_EXPERIMENTAL_BATCHED_WAIT=1
```

### Building & publishing snapshot images

```bash
#
# The n00b way
#
make sandbox

#
# The pr0 way
#
LZ_ENABLE_EXPERIMENTAL_PARALLEL_EXECUTION=1 LZ_ENABLE_EXPERIMENTAL_RETRY=1 LZ_ENABLE_EXPERIMENTAL_BATCHED_WAIT=1 make sandbox DEPLOY_ARGS_COMMON=--ci CONFIGURE_ARGS_COMMON=--ci

#
# The enterprise way
#
# Run the build and pipe the output to sandbox.log
LZ_ENABLE_EXPERIMENTAL_PARALLEL_EXECUTION=1 LZ_ENABLE_EXPERIMENTAL_RETRY=1 LZ_ENABLE_EXPERIMENTAL_BATCHED_WAIT=1 make sandbox DEPLOY_ARGS_COMMON=--ci CONFIGURE_ARGS_COMMON=--ci > sandbox.log

# Then tail the sandbox.log in a different terminal
#
# This allows you to easily navigate the logs without losing anything due to e.g. terminal size limit
tail -f sandbox.log
```

## Testnet

### Prerequisites

Testnet mnemonic with funded accounts is required for the transactions to go through:

```bash
export MNEMONIC_TESTNET="money money money money bling swag taylor swyft 50 cent london drugs"
```

### Recommended setup

Set the following environment variables for the fastest & reliable testnet deployment experience:

```bash
LZ_ENABLE_EXPERIMENTAL_PARALLEL_EXECUTION=1
```

### Deploying & configuration

As opposed to the sandbox, it's wise not to run the testnet deployment configuration in CI mode.

```bash
#
# The n00b way
#
make testnet

#
# The pr0 way
#
LZ_ENABLE_EXPERIMENTAL_PARALLEL_EXECUTION=1 LZ_ENABLE_EXPERIMENTAL_RETRY=1 make testnet DEPLOY_ARGS_COMMON=--ci
```

## Mainnet

### Prerequisites

Mainnet mnemonic with funded accounts is required for the transactions to go through:

```bash
export MNEMONIC_MAINNET="money money money money bling swag taylor swyft 50 cent london drugs"
```

### Recommended setup

Set the following environment variables for the fastest & most reliable mainnet deployment experience:

```bash
LZ_ENABLE_EXPERIMENTAL_PARALLEL_EXECUTION=1
```

### Deploying & configuration

As opposed to the sandbox, it's wise not to run the mainnet deployment configuration in CI mode.

```bash
#
# The n00b way
#
make mainnet

#
# The pr0 way
#
LZ_ENABLE_EXPERIMENTAL_PARALLEL_EXECUTION=1 LZ_ENABLE_EXPERIMENTAL_RETRY=1 make mainnet
```

The safe way of doing this though is

```bash
make deploy-mainnet
make configure-mainnet
make transfer-mainnet
```

After the mainnet has been transferred to the multisig, any new changes need to be submitted using the safe signer:

```bash
make configure-mainnet CONFIGURE_ARGS_COMMON="--safe"
```

Safe signer also supports batched mode that's currently feature-flagged in devtools:

```bash
LZ_ENABLE_EXPERIMENTAL_BATCHED_SEND=1 make configure-mainnet CONFIGURE_ARGS_COMMON="--safe"
```

## State snapshot

Current state of the on-chain configuration can be retrieved into a JSON file using the `snapshot` hardhat task from the `stg-evm-v2` package:

```bash
cd packages/stg-evm-v2
npx hardhat snapshot --stage mainnet --out snapshot-mainnet.json --log-level verbose
```

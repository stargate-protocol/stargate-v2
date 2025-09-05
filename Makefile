# None of the targets actually build any binaries so we make them all as phony
.PHONY: build deploy configure deploy-sandbox start-sandbox

# To make the code bit more DRY we'll isolate the commonly used stuff into variables
PACKAGE=@stargatefinance/stg-evm-v2
WORKSPACE=pnpm --filter $(PACKAGE)
HARDHAT=$(WORKSPACE) run hardhat

# We define the configuration commands to keep things DRY
TRANSFER_OWNERSHIP=$(HARDHAT) stg:ownable:transfer-ownership
CONFIGURE_ASSET=$(HARDHAT) stg:wire::asset
CONFIGURE_OFT=$(HARDHAT) stg:wire::oft
CONFIGURE_CIRCLE_TOKEN=$(HARDHAT) stg:wire::circle-token
CONFIGURE_CIRCLE_TOKEN_SET_ADMIN=$(HARDHAT) stg:wire::circle-token:set-admin
CONFIGURE_CIRCLE_TOKEN_INITIALIZE_MINTERS=$(HARDHAT) stg:wire::circle-token:initialize-minters
CONFIGURE_CREDIT_MESSAGING=$(HARDHAT) stg:wire::credit-messaging
CONFIGURE_TOKEN_MESSAGING=$(HARDHAT) stg:wire::token-messaging
CONFIGURE_TOKEN_MESSAGING_INITIALIZE_STORAGE=$(HARDHAT) stg:wire::token-messaging:initialize-storage
CONFIGURE_FEELIB_V1=$(HARDHAT) stg:wire::feelib-v1
CONFIGURE_REWARDER=$(HARDHAT) stg:wire::rewarder
CONFIGURE_REWARDER_REWARDS=$(HARDHAT) stg:set::rewards
CONFIGURE_STAKING=$(HARDHAT) stg:wire::staking
CONFIGURE_OFT_WRAPPER=$(HARDHAT) stg:wire::oft-wrapper
CONFIGURE_TREASURER=$(HARDHAT) stg:wire::treasurer
CONFIGURE_MINT_ALLOWANCE=$(HARDHAT) stg:set::mint-allowance
CONFIGURE_LIQUIDITY=$(HARDHAT) stg:add::liquidity

VALIDATE_RPCS = $(HARDHAT) lz:healthcheck:validate:rpcs

SOURCE_TETHER_DIR=packages/stg-evm-v2/TetherTokenV2.sol
ARTIFACTS_DIR=packages/stg-evm-v2/artifacts/
ARTIFACTS_ZK_DIR=packages/stg-evm-v2/artifacts-zk/

# Arguments to be always passed to hardhat lz:deploy devtools command
# 
# These allow consumers of this script to pass flags like --ci or --reset
DEPLOY_ARGS_COMMON=

# Specific arguments to be passed to hardhat lz:deploy devtools command
# 
# These can be overwritten by specific targets
DEPLOY_ARGS=

# Arguments to be always passed to the configuration tasks
# 
# These allow consumers of this script to pass flags like --ci
CONFIGURE_ARGS_COMMON=

# Arguments to be always passed to the validate RPCs task
# 
# These allow consumers of this script to pass flags like --continue
VALIDATE_RPCS_ARGS=


# 
# This target will build the contracts package and its dependencies
# 

build:
	pnpm build --filter $(PACKAGE)

# 
# This target will deploy contracts for a particular network stage (mainnet,testnet,sandbox)
# 
# This is a reusable target and allows customization by other, network-specific targets
# (for example for sandbox we want to reset the existing deployments)
# 

deploy:
	$(HARDHAT) lz:deploy $(DEPLOY_ARGS_COMMON) $(DEPLOY_ARGS)

# 
# This target will start the localnet containers and wait for them to be ready
# 

start-sandbox:
	$(WORKSPACE) run start --build --wait

# 
# This target will deploy the localnet contracts
# 

deploy-sandbox: DEPLOY_ARGS=--reset --stage sandbox
deploy-sandbox: build stop-sandbox start-sandbox deploy

# 
# This target will configure the sandbox contracts
# 

configure-sandbox: CONFIG_BASE_PATH=./devtools/config/sandbox
configure-sandbox:
	# First we configure the mock token ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/mocks.oft.config.ts --signer deployer

	# Set the admin to secondary role so our calls as owner get through
	$(CONFIGURE_CIRCLE_TOKEN) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-admin.config.ts --signer deployer

	# Configure the minters while we are still MasterMinters
	$(CONFIGURE_CIRCLE_TOKEN_INITIALIZE_MINTERS) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer

	# Configure everything
	$(CONFIGURE_CIRCLE_TOKEN) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer

	# Transfer ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer

	# Now we configure the assets
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.usdc.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.usdt.config.ts --signer deployer

	# Configure credit messaging
	$(CONFIGURE_CREDIT_MESSAGING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/credit-messaging.config.ts --signer deployer

	# Configure token messaging
	$(CONFIGURE_TOKEN_MESSAGING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/token-messaging.config.ts --signer deployer
	$(CONFIGURE_TOKEN_MESSAGING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/token-messaging.planner.config.ts --signer planner

	# Configure feelib V1
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdc.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdt.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eth.config.ts --signer deployer
	
	# Configure treasurer
	$(CONFIGURE_TREASURER) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/treasurer.config.ts --signer deployer
	
	# Configure staking
	$(CONFIGURE_STAKING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/staking.config.ts --signer deployer
	
	# Configure rewarder
	$(CONFIGURE_REWARDER) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/rewarder.config.ts --signer deployer

	# Configure mint/allowance for setting rewarder rewards and adding liquidity
	$(CONFIGURE_MINT_ALLOWANCE) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/mint.allowance.config.ts --signer deployer

	# Configure rewarder rewards
	$(CONFIGURE_REWARDER_REWARDS) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/rewarder.rewards.config.ts --signer deployer

	# Configure liquidity
	$(CONFIGURE_LIQUIDITY) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/deposit.config.ts --signer deployer

# 
# This target will start the localnet containers and wait for them to be ready
# 

stop-sandbox:
	$(WORKSPACE) run stop

# 
# This target will take a snapshot of the localnet EVM filesystem
# 

snapshot-sandbox:
	# This will retrieve the current EVM node state to the local filesystem
	$(WORKSPACE) run snapshot:retrieve

# 
# This target will build snapshot images from the EVM filesystem snapshots
# 

build-and-push-sandbox: snapshot-sandbox
	# This will build & publish the snapshot images
	$(WORKSPACE) run snapshot:build-and-push

# 
# Convenience target that will run the whole snapshot setup
# 

sandbox: deploy-sandbox configure-sandbox build-and-push-sandbox

# 
# This target will deploy the testnet contracts
# 

deploy-testnet: DEPLOY_ARGS=--stage testnet
deploy-testnet: build deploy

# 
# This target will configure the testnet contracts
# 

configure-testnet: CONFIG_BASE_PATH=./devtools/config/testnet
configure-testnet:
	# Validate RPCs
	$(VALIDATE_RPCS) $(VALIDATE_RPCS_ARGS) --config ./hardhat.config.ts --timeout 5000 --stage testnet

	# Configure the OFTs
	$(CONFIGURE_OFT) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/oft-token.config.ts --signer deployer

	# Configure the minters while we are still MasterMinters (USDC and EURC)
	$(CONFIGURE_CIRCLE_TOKEN_INITIALIZE_MINTERS) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer
	$(CONFIGURE_CIRCLE_TOKEN_INITIALIZE_MINTERS) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/eurc-token.config.ts --signer deployer

	# Configure everything for USDC
	$(CONFIGURE_CIRCLE_TOKEN) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer

	# Configure everything for EURC
	$(CONFIGURE_CIRCLE_TOKEN) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/eurc-token.config.ts --signer deployer

	# Transfer USDC ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer

	# Transfer EURC ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/eurc-token.config.ts --signer deployer

	# Copy TetherTokenV2.sol directory to the artifacts directory
	cp -r $(SOURCE_TETHER_DIR) $(ARTIFACTS_DIR)

	# Copy TetherTokenV2.sol directory to the artifacts-zk directory
	cp -r $(SOURCE_TETHER_DIR) $(ARTIFACTS_ZK_DIR)

	# Transfer USDT ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdt-token.config.ts --signer deployer

	# Configure the assets
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.usdc.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.eurc.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.usdt.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.eth.config.ts --signer deployer

	# Configure credit messaging
	$(CONFIGURE_CREDIT_MESSAGING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/credit-messaging.config.ts --signer deployer

	# Configure token messaging
	$(CONFIGURE_TOKEN_MESSAGING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/token-messaging.config.ts --signer deployer

	# Initialize bus storage for token messaging
	# $(CONFIGURE_TOKEN_MESSAGING_INITIALIZE_STORAGE) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/token-messaging.config.ts --signer deployer

	# Configure feelib V1
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdc.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eurc.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdt.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eth.config.ts --signer deployer

	# Transfer the feelib V1 ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdc.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eurc.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdt.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eth.config.ts --signer deployer

	# Configure treasurer
	$(CONFIGURE_TREASURER) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/treasurer.config.ts --signer deployer

	# Configure staking
	$(CONFIGURE_STAKING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/staking.config.ts --signer deployer

	# Configure rewarder
	$(CONFIGURE_REWARDER) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/rewarder.config.ts --signer deployer

	# Configure mint/allowance for setting rewarder rewards and adding liquidity
	$(CONFIGURE_MINT_ALLOWANCE) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/mint.allowance.config.ts --signer deployer

	# Configure rewarder rewards
	$(CONFIGURE_REWARDER_REWARDS) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/rewarder.rewards.config.ts --signer deployer

	# Configure liquidity
	$(CONFIGURE_LIQUIDITY) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/deposit.config.ts --signer deployer

testnet: deploy-testnet configure-testnet

# 
# This target will deploy the mainnet contracts
# 

deploy-mainnet: DEPLOY_ARGS=--stage mainnet
deploy-mainnet: build deploy

# 
# This target will configure everything that is easier to configure with a hot wallet
# 

preconfigure-mainnet: CONFIG_BASE_PATH=./devtools/config/mainnet/01
preconfigure-mainnet:
	# Validate RPCs
	$(VALIDATE_RPCS) $(VALIDATE_RPCS_ARGS) --config ./hardhat.config.ts --stage mainnet

	# Configure the OFTs
	$(CONFIGURE_OFT) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/oft-token.config.ts --signer deployer

	# Configure the minters while we are still MasterMinters
	$(CONFIGURE_CIRCLE_TOKEN_INITIALIZE_MINTERS) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer --token-name usdc
	$(CONFIGURE_CIRCLE_TOKEN_INITIALIZE_MINTERS) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/eurc-token.config.ts --signer deployer --token-name eurc

	# Configure everything else for USDC and EURC
	$(CONFIGURE_CIRCLE_TOKEN) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer --token-name usdc
	$(CONFIGURE_CIRCLE_TOKEN) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/eurc-token.config.ts --signer deployer --token-name eurc

# 
# This target will configure the mainnet contracts
# 

configure-mainnet: CONFIG_BASE_PATH=./devtools/config/mainnet/01
configure-mainnet:
	# Validate RPCs
	$(VALIDATE_RPCS) $(VALIDATE_RPCS_ARGS) --config ./hardhat.config.ts --stage mainnet

	# Configure the assets
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.eth.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.meth.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.metis.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.usdc.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.usdt.config.ts --signer deployer
	$(CONFIGURE_ASSET) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.eurc.config.ts --signer deployer

	# Configure credit messaging
	$(CONFIGURE_CREDIT_MESSAGING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/credit-messaging.config.ts --signer deployer

	# Configure token messaging
	$(CONFIGURE_TOKEN_MESSAGING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/token-messaging.config.ts --signer deployer

	# Initialize bus storage for token messaging
	#
	# We want this particular configuration to never be batched as the individual transactions are quite gas-intensive
	# LZ_ENABLE_EXPERIMENTAL_BATCHED_SEND="" $(CONFIGURE_TOKEN_MESSAGING_INITIALIZE_STORAGE) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/token-messaging.config.ts --signer deployer

	# Configure feelib V1
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eth.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.meth.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.metis.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdc.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdt.config.ts --signer deployer
	$(CONFIGURE_FEELIB_V1) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eurc.config.ts --signer deployer

	# Configure treasurer
	$(CONFIGURE_TREASURER) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/treasurer.config.ts --signer deployer

	# Configure staking
	$(CONFIGURE_STAKING) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/staking.config.ts --signer deployer

	# Configure rewarder
	$(CONFIGURE_REWARDER) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/rewarder.config.ts --signer deployer

	# Configure OFT Wrapper
	$(CONFIGURE_OFT_WRAPPER) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/oft-wrapper.config.ts --signer deployer

transfer-mainnet: CONFIG_BASE_PATH=./devtools/config/mainnet/01
transfer-mainnet:
	# The OFTs
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/oft-token.config.ts --signer deployer

	# Transfer USDC ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdc-token.config.ts --signer deployer

	# Transfer EURC ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/eurc-token.config.ts --signer deployer

	# Copy TetherTokenV2.sol directory to the artifacts directory
	cp -r $(SOURCE_TETHER_DIR) $(ARTIFACTS_DIR)

	# Copy TetherTokenV2.sol directory to the artifacts-zk directory
	cp -r $(SOURCE_TETHER_DIR) $(ARTIFACTS_ZK_DIR)
	
	# Transfer USDT ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/usdt-token.config.ts --signer deployer

	# The assets
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.eth.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.meth.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.metis.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.usdc.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.usdt.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/asset.eurc.config.ts --signer deployer

	# Configure credit messaging
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/credit-messaging.config.ts --signer deployer

	# Configure token messaging
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/token-messaging.config.ts --signer deployer

	# Transfer the feelib V1 ownership
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eth.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.meth.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.metis.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdc.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdt.config.ts --signer deployer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eurc.config.ts --signer deployer

	# Configure treasurer
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/treasurer.config.ts --signer deployer

	# Configure staking
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/staking.config.ts --signer deployer

	# Configure rewarder
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/rewarder.config.ts --signer deployer

	# Configure OFT wrapper
	$(TRANSFER_OWNERSHIP) $(CONFIGURE_ARGS_COMMON) --oapp-config $(CONFIG_BASE_PATH)/oft-wrapper.config.ts --signer deployer

# Please be careful with this target, I'd much rather you run the commands one by one
# 
# make deploy-mainnet
# make preconfigure-mainnet
# make transfer-mainnet
# make configure-mainnet
mainnet: deploy-mainnet preconfigure-mainnet transfer-mainnet configure-mainnet


# Check configuration targets
network ?= mainnet
ifeq ($(network),mainnet)
    CONFIG_BASE_PATH=./devtools/config/mainnet/01
else
    CONFIG_BASE_PATH=./devtools/config/testnet
endif

check-assets:
	$(HARDHAT) stg:check::asset --oapp-config $(CONFIG_BASE_PATH)/asset.eth.config.ts
ifeq ($(network),mainnet)
	# only check meth and metis on mainnet
	$(HARDHAT) stg:check::asset --oapp-config $(CONFIG_BASE_PATH)/asset.meth.config.ts
	$(HARDHAT) stg:check::asset --oapp-config $(CONFIG_BASE_PATH)/asset.metis.config.ts
endif
	$(HARDHAT) stg:check::asset --oapp-config $(CONFIG_BASE_PATH)/asset.usdc.config.ts
	$(HARDHAT) stg:check::asset --oapp-config $(CONFIG_BASE_PATH)/asset.usdt.config.ts
	$(HARDHAT) stg:check::asset --oapp-config $(CONFIG_BASE_PATH)/asset.eurc.config.ts

check-feelibs:
	$(HARDHAT) stg:check::feelib-v1 --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eth.config.ts
ifeq ($(network),mainnet)
	# only check meth and metis on mainnet
	$(HARDHAT) stg:check::feelib-v1 --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.meth.config.ts
	$(HARDHAT) stg:check::feelib-v1 --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.metis.config.ts
endif
	$(HARDHAT) stg:check::feelib-v1 --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdc.config.ts
	$(HARDHAT) stg:check::feelib-v1 --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.usdt.config.ts
	$(HARDHAT) stg:check::feelib-v1 --oapp-config $(CONFIG_BASE_PATH)/feelib-v1.eurc.config.ts

check-treasurer:
	$(HARDHAT) stg:check::treasurer --oapp-config $(CONFIG_BASE_PATH)/treasurer.config.ts

check-staking:
	$(HARDHAT) stg:check::staking --oapp-config $(CONFIG_BASE_PATH)/staking.config.ts

check-rewarder:
	$(HARDHAT) stg:check::rewarder --oapp-config $(CONFIG_BASE_PATH)/rewarder.config.ts

check-oft-wrapper:
ifeq ($(network),mainnet)
	$(HARDHAT) stg:check::oft-wrapper --oapp-config $(CONFIG_BASE_PATH)/oft-wrapper.config.ts
endif

check-token-messaging:
	$(HARDHAT) stg:check::token-messaging --oapp-config $(CONFIG_BASE_PATH)/token-messaging.config.ts

check-credit-messaging:
	$(HARDHAT) stg:check::credit-messaging --oapp-config $(CONFIG_BASE_PATH)/credit-messaging.config.ts
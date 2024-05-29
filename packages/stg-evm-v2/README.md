## Stargate

Stargate is a fully composable liquidity transport protocol that lives at the heart of omnichain DeFi.
With Stargate, users and dApps can transfer native assets cross-chain while accessing the protocol’s unified liquidity pools.
Stargate contracts use LayerZero as their cross-chain transport protocol.

On each chain supported, Stargate contracts are deployed for each asset. This represents the asset/native swap pair, allowing
users to transfer assets across chains. When value is transferred from an account, it gets transferred to the Stargate
contract which is then responsible for ingesting/removing that value locally and emitting a message. Value is transferred across
chains by message passing, with each message indicating the destination chain, account and currency. The Stargate contract on the
remote chain is then responsible for egressing the value/token from the contract into the destination account. Value is
transferred from one chain to another through a Path. Paths are a pair of source and destination chains and have credit associated
with them. Value can only be transferred through a Path that has enough credit, as credit represents the liquidity of the Path.
The value can be send through different modes:

* Taxi, the fastest but most expensive one, which ensures the value is sent on its own cross-chain message.
* Bus, the cheapest but potentially slowest one, which means the message is batched with other bus riders.
* Drive, drives the bus.

Stargate contracts act as their own treasury, they hold the native coin that can be used to buy tokens locally while `receiving` tokens.


## Architecture
Stargates on each chain provide sending and receiving functionality through a series of contracts. The cross-chain protocol is Layer Zero,
and the entry-point or landing point for messages is an OApp. In particular, Stargate has multiple layers described as follows:

### Layers
* LayerZero Layer
This layer handles receiving cross-chain messages from the off-chain infrastructure. It is implemented by the LayerZero endpoint and it is
not part of Stargate, but included here for completeness. Stargate needs to register with the endpoint and setup the adequate wiring.

* Messaging Layer
The Messaging Layer is responsible for sending and receiving LZ messages. It includes codecs to translate between LZ and Stargate messages.
This layer also routes the Stargate messages to the appropriate Stargate contracts using the AssetId.
To send and receive messages from LZ, this layer derives from the OApp contract. To send Stargate messages over, it implements the IMessaging interface.
This layer is implemented in the Messaging contract.

* Stargate Layer
This layer is responsible for the actual Stargate business logic. To receive Stargate messages from the Messaging Layer it implements the IMessagingReceiver
interface. All contracts derive from the StargateBase contract and there is three implementations at the time of writing:
- StargateOFT, which supports sending and receiving ERC20 OFTs.
- StargatePool, which supports liquidity pools for OFTs.
- StargatePoolNative, which supports a liquidity pool using the native token.
A given asset will be supported by one of these implementations.

This layer does the credit bookkeeping, reward/fee processing and is also the chain-local entrypoint for user interactions. Apart from the Stargate contract
it employs a series of adjacent contracts; notably the FeeLib for calculating transfer fees/rewards, the Bus library to support message batching, and roles
described below.

Part of the Stargate business logic includes moving tokens to and from user accounts. This is described as inflow (value goes into the Stargate) and outflow
(value goes into the users account) across the code. In the case of OFTs, this translates to actually minting and burning OFTs.
Fees/rewards are paid on the source chain upon sending tokens.

To illustrate, receiving a token would follow this chain of calls:
                                                                                                            
 ┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐  
 │               │     │               │     │               │     │               │     │               │  
 │   Off-chain   ├────►│  LZ Endpoint  ├────►│  Messaging    ├────►│    Stargate   ├────►│  User Account │  
 │               │     │               │     │               │     │               │     │               │  
 └───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘  
                                                                                                            
Sending a token is very similar in the reverse order.

### Roles
A role is an address (can be either a contract or an EOA) that has special permissions to call functions on a contract. Stargate
employs multiple roles:

* Owner The owner of the contracts
    - setAssetId
    - setPlanner
    - setAddressConfig
    - setOFTPath

The Owner of Stargate contracts is responsible for configuring the Stargate. This includes setting up roles, libraries and configuration like asset IDs.

* Planner
    - setBusCapacity
    - setBusFare
    - sendCredits
    - setPause
    - setDeficitOffset

The account responsible for keeping liveness through bus scheduling and liquidity balancing. It can directly send credits to a Path to provide liquidity,
as well as modify the Bus operating parameters (capacity and fare) to incentivize the utilization of a given path. It can also use `setDeficitOffset` to
change the set-point for pool liquidity. This will incentivize rebalancing once the locked in value is removed. Additionally, it can pause a Stargate,
which means the contract stops sending and receiving tokens. The role can be assigned by the Owner of the Stargate contract.

* Treasurer
    - withdrawTreasuryFee
    - addTreasuryFee

The treasurer controls the value (treasury) inside a Stargate contract. It can both add and withdraw from the treasury, which are administrative tasks.
Adding to the treasury allows the Stargate contract to pay rewards beyond the value it has accrued through fees, which is important on the initial days
of a pool. Withdrawing from the treasury allows the administrator to take the profits from the fees. Both functions can only be accessed by the Admin role.

* Admin
    - withdrawTreasuryFee
    - addTreasuryFee

The admin role is allowed to use the Treasurer role to modify the treasury of a Stargate contract. The role can be assigned by the Owner of the Treasurer.

### Composition
Stargate supports composing, which refers to the ability of Stargate contracts to deliver messages along with tokens. This enables receiving contracts to
react and execute additional logic. In particular, Stargate leverages LayerZero composing feature. When a message is delivered which contains a composing
message, LZ sendCompose() is called with the message.

## User interaction
Users interact with Stargate contracts directly through the send() function. They can use the Quote* functions to estimate the fees/rewards involved in a
transfer.

## Nomenclature

* Path
    A route through which value can be sent. It involves a source chain and a destination chain (indicated by the LZ endpoint ID).
* SD Shared Decimals
    The minimum common decimals among all implementations of a given OFTs.
* LD Local Decimals
    The amount of decimals for a an implementation of an OFT (in the local chain)
* LP Liquidity Pool
* STG
    Stargate token symbol
* LZ
    LayerZero, an inter-chain communication layer
* Credit
    Credit refers to the liquidity that a certain path has. Off-chain infrastructure might decide to incentivize or de-incentivize a given path to balance
    credit. Whenever tokens are moved from one chain to another, credit drops on the sending side.
* Fee
    Stargate might charge some value to perform the swap. This value is known as the Stargate fee and it is accrued as value on the Stargate contract,
    known as the treasury. There is also a LayerZero fee that needs to be paid. Fees can be estimated by users using the Quote* functions.
* Reward
    A value paid by Stargate to incentivize the flow of an asset in one direction, or to reward for value locked staking.
* Inflow
    The transference of value into a Stargate contract. In the context of fees/rewards it also means original amount being transferred.
* Outflow
    The transference of value out of a Stargate contract. In the context of fees/rewards it also means the actual amount after applying fees/rewards
    but before applying any caps.
* Compose
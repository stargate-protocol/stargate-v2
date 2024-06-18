<p align="center">
  <a href="https://stargate.finance">
    <img src="https://stargate.finance/static/og-image.jpg"/>
  </a>
</p>

# stargate-v2

## Introduction

Stargate v2 introduces new features to Stargate that both dramatically reduce cost, and significantly increase capital efficiency while still maintaining IGF (Instant Guarantee of Finality), Unified Pools of Liquidity, and Native to Native asset swaps. The following subsections are a brief overview of the new features within Stargate v2.

### Bus

One of the biggest drawbacks in Stargate v1, was the gas costs to send a message, book fees, and update pools using the novel Delta Algorithm. In Stargate v2, we introduce the concept of Buses. Buses are Stargate swaps that settle locally (via IGF), but wait to be sent to the destination chain when a "bus" full of typically 3-5 transactions to a given destination is full and ready to be sent, or an eager rider pays extra to send the bus early. This dramatically reduces cumulative gas cost for a given transaction from ~550k Local and ~220k remote to ~100k local only resulting in a massive reduction in gas costs.

### Planner

Stargate v1 utilized the Delta Algorithm for fully on chain credit allocation between asynchronous states across tens of blockchains. The algorithm although fully on chain requires a significant amount of capital to stay competitive in pricing among other bridges in the space. In Stargate v2, we introduce the concept of a Planner. A Planner is a trusted entity that can allocate credit between chains off chain, and then submit the credit allocation to the bridge. This allows for a significant reduction in capital requirements, and allows for the bridge to be more competitive in pricing. The Planner has no ability to steal funds, and can only allocate credits that have been sent to it via messaging. This allows Stargate v2 to be extremely competitive in it's pricing, while still maintaining the security of the bridge.

### Hydra

Almost a year to the date of Stargate v2 launch, Stargate discussed the creation of a wrapped asset bridge that would use the underlying asset from the bridge as POL (protocol owned liquidity) to reduce need for LP and overall costs on the protocol. Since then v2 has incorporated this idea as a built in way to do just that. Users can now bridge native assets from anywhere to a Stargate wrapped OFT that can transfer between each chain that does not have the native asset and be redeemed anywhere an native asset pool exists.

### JIT Liquidity Intents

Stargate v2 also comes with intent based swaps and redemptions both onchain and offchain to coordinate with the planner to move Just in Time liquidity (via credits) to the origin chain allowing the user to experience a seamless swap where liquidity doesn't exist.

### End Game

Welcome to the end game of bridges, with hyper optimized smart contracts built to reduce every ounce of gas we could find, an offchain planner that can set and lower fees to stay competitive with other bridges, and a bus system that allows for a 91% reduction in gas costs, Hydra OFTs, and JIT Liquidity Intents Stargate v2 is primed to be the most efficient bridge in the space.

## Installation

```shell
pnpm install
pnpm clean
pnpm build
pnpm test
```

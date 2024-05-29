# Stargate Rewarder
The Stargate Rewarder distributes reward tokens to people who stake their Stargate V2 LP tokens inside of it.

## Design & Separation of concern

The Stargate Rewarder consists of two components:
* The `StargateStaking` contract (The "staker") - Handles and manages the LP tokens
* The `StargateMultiRewarder` contract (The "rewarder") - Handles and manages the rewards, informed by the above on LP balance changes.

This separation was made as to keep the complex reward logic isolated from the logic which handles user deposits, allowing for the contract that handles user deposits to be ridiculously simple. Thanks to this separation, the rewarder logic can never affect the LPs, as these are in a separate contract. Furthermore, thanks to the `emergencyWithdraw` function which does not update the rewarder, LPs can always be withdrawn, even if the rewarder is  broken.

The separation is possible due to every balance change being communicated with the rewarder. This communication contains the old balance of the user and the old total deposits into the staking LP pool. These two variables, alongside the address of who is depositing and the amount they're depositing, are sufficient fo the rewarder to work out what portion of the rewards they are eligible for.

### Zapping & composition
The staking contract can be integrated as a "defi block" through the functions `depositTo` and `withdrawToAndCall`. These allow for the user to for example instantly convert ("zap") their USDC into a staked LP token. This is typically done by approving an intermediary contract that deposits the USDC in the Stargate core and then calls `depositTo` on the staking contract, with the user wallet as the destination. The inverse of this operation can be done by `withdrawToAndCall`, which needs to be called by the user with the `to` parameter set to the zapper.

It should be noted that `depositTo` can only be called by smart contracts, this has been done to avoid phishing attacks as there's no reason for an EOA to deposit to another address. A phishing attack is when the frontend is compromised and tries to convince the user to sign malicious transactions.

It should be noted that `withdrawToAndCall` can only be called to smart contracts and is supposed to be called by the depositing users. The smart contracts must implement the `IStakingReceiver` interface which defines the `onWithdrawalReceived` function. As another sanity check to avoid `withdrawToAndCall` from being called on non-compliant contracts, this function must return the selector of itself.

## Stargate Staking
The staking contract is the interface for users. It allows them to deposit and withdrawal LP tokens. It furthermore allows them to claim emission rewards.

The staking contract owner can configure the rewarder each individual pool is linked to. This rewarder is called whenever a deposit, depositTo, withdraw, claim or withdrawToAndCall is made on the specified pool, as to allow for reward indexation and distribution.

### User interface

* `deposit`: Deposits `amount` of `token` into the pool. Informs the rewarder of the deposit, triggering a harvest.
* `depositTo`: Deposits `amount` of `token` into the pool for `to`. Informs the rewarder of the deposit, triggering a harvest. This function can only be called by a contract, as to prevent phishing by a malicious contract. This function is useful for zappers, as it allows to do multiple steps ending with a deposit, without the need to do multiple transactions.
* `withdraw`: Withdraws `amount` of `token` from the pool. Informs the rewarder of the withdrawal, triggering a harvest.
* `withdrawToAndCall`: Withdraws `amount` of `token` from the pool for `to`, and subsequently calls the receipt function on the `to` contract. Informs the rewarder of the withdrawal, triggering a harvest. This function is useful for zappers, as it allows to do multiple steps starting with a withdrawal, without the need to do multiple transactions. Users should be careful as the `to` parameter needs to be a contract they trust, otherwise it could steal their withdrawal.
* `emergencyWithdraw`: Withdraws `amount` of `token` from the pool in an always-working fashion. The rewarder is not informed.
* `claim`: Claims the rewards from the rewarder, and sends them to the caller.

### Owner interface

* `setPool`: Configures the rewarder for a pool. This will initialize the pool if it does not exist yet, whitelisting it for deposits.
* `transferOwnership`: Transfers ownership to a new owner. Triple check that you control the new owner.
* `renounceOwnership`: Disabled.

### View/UI functions

* `balanceOf`: Returns the deposited balance of `user` in the pool of `token`.
* `totalSupply`: Returns the total supply of the pool of `token`.
* `isPool`: Returns whether `token` is a pool.
* `tokensLength`: Returns the number of pools.
* `tokens`: Returns the list of pools, by their staking tokens. A sliced alternative of this function is provided as well.
* `rewarder`: Returns the rewarder of the pool of `token`, responsible for distribution reward tokens.


### IMPORTANT: Contract management footguns!

* The `StargateStaking` contract strictly does not support staking tokens with a tax-on-transfer or rebasing properties! Staking `stETH` would for example result in tokens getting permanently stuck in the contract over time. We did not include a `skim()` function, though this could be included pretty easily if desired.
* The `StargateStaking` contract does not support staking the native gas token, it can only be distributed as a reward. Consider zapping in WETH if staking the gas token is desired.

## Stargate Multi Rewarder
The multi rewarder allows for the distribution of multiple ERC20 rewards to stakers, alongside the native gas token.

To configure a reward token, it must first be deposited by the admin using `setReward`. After being configured, the rewardToken can be allocated to staking pools by calling `setAllocPoints`, which allows for configuring the weights of each of the pools.

To extend rewards, `extendReward` can be called if the reward is still active, which linearly extends the reward duration with the provided amount, according to the emission rate of the reward token.

To reconfigure the emission rate or any other parameters, `setReward` can be called again. If the reward period has not yet ended when `setReward` is called again, any non-distributed rewards are rolled over and added on top of the provided amount. This means that the reward rate will end up being larger than the expected rate based on the provided amount.

Once `setAllocPoints` is called, the provided pools are permanently linked to the reward token until the reward token is fully retired via `stopReward`. This means that even if you set the alloc points of a pool to zero, it will remain linked and continue consuming gas on harvests. This is to ensure that anyone with a pending harvest on this pool can still claim it, even if the pool is no longer receiving rewards.

Finally, `stopReward` fully retires a reward token from the rewarder. This means that all pending harvests will be voided. As long as the `pullTokens` parameter is set to true, the whole balance of the reward within the rewarder is sent to the `receiver` parameter. This optionality is provided as certain reward tokens might start reverting due to being paused, in that case `pullTokens` should be set to false. This allows for those tokens to still be stopped, unbricking the rewarder.

The MultiRewarder has been designed to allow for the re-enabling of reward tokens. Once stopped, a reward token can be re-enabled simply by calling `setReward` again. Note that the allocation points must be reconfigured for the reward at this point, as all reward details including the allocation points are wiped out when the reward is stopped.

### User interface

None: Users are supposed to exclusively interact through the staking contract.

### Owner interface

* `setReward`: Sets the reward for `rewards` of `rewardToken` over `duration` seconds, starting at `start`. The actual reward over this period will be increased by any rewards on the pool that haven't been distributed yet. Requires ERC20 approval from the sender or gas tokens to be provided.
* `extendReward`: Extends the reward duration for `rewardToken` by `amount` tokens, extending the duration by the equivalent time according to the `rewardPerSec` rate of the pool. Requires ERC20 approval from the sender or gas tokens to be provided.
* `setAllocPoints`: Configures allocation points for a reward token over multiple staking tokens, setting the `allocPoints` for each `stakingTokens` and updating the `totalAllocPoint` for the `rewardToken`. The allocation points of any non-provided staking tokens will be left as-is, and won't be reset to zero.
* `stopRewards`: Unregisters a reward token fully, immediately preventing users from ever harvesting their pending accumulated rewards. Optionally `pullTokens` can be set to false which causes the token balance to not be sent to the owner, this should only be set to false in case the token is bugged and reverts.

### View/UI functions

* `getRewards`: Returns the reward pools linked to the `stakingToken` alongside the pending rewards for `user` for these pools. Returns zero if the user has a zero stake.
* `allocPointsByReward`: Returns the allocation points for the `rewardToken` over all staking tokens linked to it.
* `allocPointsByStake`: Returns the allocation points for the `stakingToken` over all reward tokens linked to it.
* `rewardTokens`: Returns all enabled reward tokens. Stopped reward tokens are not included, while ended rewards are.
* `rewardDetails`: Returns the emission details of a `rewardToken`, configured via `setReward`.

### Gas token support
The native gas token is encoded as the reward token address `0x0`. Simply provide this address to setReward, extendReward, stopReward... with the necessary gas tokens attached to the transaction.

It should be noted that if a smart contract deposits into a pool while this pool has gas token emissions, they may need to emergencyWithdraw in case they don't have a `receive` function, as smart contracts do not allow for ETH receival by default.

It is therefore required that any integration on top of the staking contract (eg. yield optimizers) supports the `emergencyWithdraw` operation, to ensure that the deposits can always be withdrawn again.

### IMPORTANT: Contract management footguns!

* As said above, gas-token harvests to a smart contract without a `receive` function revert, meaning that those contracts must call `emergencyWithdraw` to receive their initial stake back.
* Deposits, withdrawals and claims will harvest all reward tokens that are linked to the staking pool. If a large number of tokens is linked (eg. 50), this gas-cost could exceed the block gas limit. Do not configure excessive reward tokens!
* Reconfiguring allocPoints for a reward token, alongside stopping that reward token, requires looping over all staking tokens linked to that reward token. If a large number of tokens are linked (eg. 100), this gas-cost could exceed the block gas limit. Do not configure excessive staking pools to a single reward token, especially on chains with low gas limits (eg. aurora)!
* The rewarder uses masterchef logic to calculate reward amounts. This logic multiplies the reward balance by a large precision factor. If a reward with a high number of decimals is ever desired to be distributed, it's likely that the rewarder will start reverting due to overflow, requiring the reward to be stopped before people can deposit/withdraw again. If such tokens are desired to be supported, we recommend looking into a `mulDiv` library to avoid the overflow altogether. The `RewardLib.t.sol` tests can be explored to further understand this, alongside the fact that reward tokens with excessively low decimals may have rounding issues. These tests validate that the expected tokens (6 decimals to 18 decimals denominated in USD) do not have excessive rounding or expected overflow.
* Stopping rewards removes any pending harvests. Depositors will lose them. As long as `pullTokens` is configured, these tokens will be returned to the provided receiver, alongside any other amount of the reward token within the contract.
* Adjusting allocation points only adjusts the provided pools, any non-provided pool is left as-is.
* `setReward` does no sanity checks on the provided `duration` being sufficiently long. If you accidentally reset the rewards with a short duration, all previously undistributed rewards alongside with the newly provided `amount` may be distributed nearly instantly. Always carefully triple check the provided parameters! 
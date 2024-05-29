# Stargate zappers

## StargateZapperV1
The StargateZapperV1 allows for the following operations:
- Zap from an asset such as USDC into an LP staked into the Stargate V2 rewarder
- Zap from a staked LP back to an asset such as USDC
- Migrate a V1 LP into a V2 staked position

Typically all of these operations would require multiple steps. However, now they solely require a single logical step, alongside a single approval step.

### User interface

* `depositAndStake`: Deposits an asset such as USDC into a stargate V2 pool and stakes the resulting LP token into the Stargate V2 Staking contract, all in a single transaction. Requires approval of the underlying asset of the LP pool.
* `depositAndStakeWithPermit`: Deposits an asset such as USDC into a stargate V2 pool and stakes the resulting LP token into the Stargate V2 Staking contract, all in a single transaction. Replaces approval requirement with a permit signature input.
* `migrateV1LpToV2Stake`: Migrates a V1 LP token to V2 and stakes the resulting LP token into the Stargate V2 Staking contract, all in a single transaction. Requires approval of the V1 LP token.
* `migrateV1LpToV2StakeWithPermit`: Migrates a V1 LP token to V2 and stakes the resulting LP token into the Stargate V2 Staking contract, all in a single transaction. Replaces approval requirement with a permit signature input.
* `staking.withdrawToAndCall(V2LP, zapper, lpAmount, abi.encode(minAssetOut))`: Unstakes and redeems a V2 LP token to the underlying asset such as USDC in a single transaction. Called through `StargateStaking.withdrawToAndCall`.

### Owner interface

* `configureLpToken`: Whitelist a V2 stargate LP for zapping, required for `depositAndStake` and `StargateStaking.withdrawToAndCall`, uses the LP `stargate()` function to figure out the actual pool, alongside with the pool's `token()` function to figure out the actual asset such as usdc.
* `configureV1Pool`: Whitelist a V1 pool ID to a V2 LP token for migration. Can only be called after `configureLpToken`. Uses `factoryV1.getPool(v1PoolId)` to figure out and store the V1 pool address from the pool id.
* `sweep`: Withdraws tokens from the contract, these can become stuck in the contract most notably through the rounding (local decimal to shared decimal rounding) which occurs during the stargate pool's `deposit` function. Tokens accidentally sent to the contract can also be withdrawn by the owner via `sweep`.
* `transferOwnership`: Transfers ownership to a new owner. Triple check that you control the new owner.
* `renounceOwnership`: Renounces ownership preventing re-configuration. Should realistically not be used.
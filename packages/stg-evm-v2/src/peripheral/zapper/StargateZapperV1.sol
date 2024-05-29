// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

import { IStargateV1Pool } from "./interfaces/IStargateV1Pool.sol";
import { IStargateV1Router } from "./interfaces/IStargateV1Router.sol";
import { IStargateV1Factory } from "./interfaces/IStargateV1Factory.sol";
import { IStargateEthVault } from "./interfaces/IStargateEthVault.sol";

import { LPToken } from "../../utils/LPToken.sol";
import { IStargateStaking } from "../rewarder/interfaces/IStargateStaking.sol";
import { IStargatePool } from "../../interfaces/IStargatePool.sol";

import { IStargateZapperV1, IERC20 } from "./interfaces/IStargateZapperV1.sol";

/**
 * @title Stargate Zapper - V1
 * @notice The Stargate Zapper V1 contract allows users to zap into and out of Stargate V2 LP tokens,
 *         as well as migrate from V1 LP tokens to V2 LP tokens.
 */
contract StargateZapperV1 is Ownable, IStargateZapperV1 {
    using SafeERC20 for IERC20;

    address private constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /// @dev The Stargate V2 StargateStaking contract, which the V2 LP tokens are staked into.
    IStargateStaking public immutable staking;
    /// @dev The Stargate V1 Router contract, for migrating from V1 LPs to V2 stakes.
    IStargateV1Router public immutable routerV1;
    /// @dev The Stargate V1 Factory contract, for migrating from V1 LPs to V2 stakes.
    IStargateV1Factory public immutable factoryV1;
    /// @dev The stargate V1 eth vault, used as the underlying V1 ETH LP token.
    IStargateEthVault public immutable ethVault;

    /// @dev Mapping of V2 LP tokens to their corresponding V2 StargatePool.
    mapping(IERC20 lpToken => IStargatePool pool) public lpToPool;
    /// @dev Mapping of V2 LP tokens to their pool's underlying asset (eg. USDC).
    mapping(IERC20 lpToken => IERC20 asset) public lpToAsset;
    /// @dev Mapping of V1 pool IDs to their corresponding V2 LP tokens, used for migration.
    mapping(uint16 v1PoolId => IERC20 lpToken) public v1PidToV2Lp;
    /// @dev Mapping of V1 pool IDs to their corresponding V1 LP tokens, used for migration.
    mapping(uint16 v1PoolId => IERC20 lpToken) public v1PidToV1Lp;
    /// @dev Mapping of V1 pool IDs to their pool's conversion rate, used for ETH migration exclusively.
    mapping(uint16 v1PoolId => uint256 conversionRate) public v1PidToConversionRate;

    /**
     * @dev Constructor for initializing the zapper.
     * @param _staking The Stargate V2 StargateStaking contract.
     * @param _routerV1 The Stargate V1 Router contract. Used for migration.
     * @param _ethVault The Stargate V1 ETH vault, which is the underlying token for the V1 ETH LP,
     *        can be set to zero if it does not exist. Used for migration.
     */
    constructor(IStargateStaking _staking, IStargateV1Router _routerV1, IStargateEthVault _ethVault) {
        staking = _staking;
        routerV1 = _routerV1;
        factoryV1 = _routerV1.factory();
        ethVault = _ethVault;
    }

    /**
     * ZAPS
     */

    /**
     * @notice Unstakes and redeems a V2 LP token to the underlying asset (such as USDC) in a single transaction.
     *         Called through `StargateStaking.withdrawToAndCall`.
     * @dev Frontend must use the underlying protocol events to determine the actual amount of the asset received.
     * @dev Compliant with StargatePoolNative.
     * @dev The `data` provided via `withdrawToAndCall` must be `abi.encode(minTokenOut)` with
     *      `minAssetOut` an `uint256`.
     * @param lpToken The V2 LP token to redeem, validated by `StargateStaking`.
     * @param from The address that is withdrawing the LP token, validated by `StargateStaking`.
     * @param value The amount of LP tokens to redeem, validated by `StargateStaking` and already sent into this
     *        contract before the `onWithdrawReceived` call.
     * @param data The data provided by the `from` user to specify the minimum amount of the underlying asset to
     *        receive, this is not validated beforehand in any way.
     */
    function onWithdrawReceived(
        IERC20 lpToken,
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        if (msg.sender != address(staking)) revert StargateZapperV1__OnlyCallableByStaking();

        IStargatePool pool = lpToPool[lpToken];
        if (address(pool) == address(0)) revert StargateZapperV1__UnknownLpToken(lpToken);
        if (value == 0) revert StargateZapperV1__ZeroAmount();

        uint256 minAssetOut = abi.decode(data, (uint256));

        uint256 redeemed = pool.redeem(value, from);
        if (redeemed < minAssetOut) {
            revert StargateZapperV1__InsufficientOutputAmount({ actual: redeemed, expect: minAssetOut });
        }

        return this.onWithdrawReceived.selector;
    }

    /**
     * @notice Deposits an asset into a stargate pool and stakes the resulting LP token into the Stargate V2 Staking
     *         contract, all in a single transaction. Requires approval of the underlying asset of the LP pool.
     * @dev Frontend must use the underlying protocol events to determine the actual amount of the asset received.
     * @dev The `StargatePool` might round down the input amount slightly due to the local decimal to shared decimal
     *      conversion. The frontend must take care of providing properly rounded input amounts as for gas efficiency
     *      this rounding is not refunded. Users are still in control of not receiving less than expected by setting
     *      the minimum received param. If these tokens ever add up to anything, the `owner` can take them out as fees
     *      via `sweep`.
     * @dev Compliant with StargatePoolNative, but requires input to be properly rounded with the shared to local
     *      decimal adjustment, eg. no dust.
     * @param lpToken The V2 LP token to zap into and stake, the underlying asset (such as USDC) of this LP token is
     *        transferred from the transaction sender.
     * @param assetInAmount The amount of the underlying asset (such as USDC) to zap in.
     * @param minStakeAmount The minimum amount of the LP token to stake into the Stargate V2 Staking contract,
     *        as an extra check against rounding slippage and fees.
     */
    function depositAndStake(IERC20 lpToken, uint256 assetInAmount, uint256 minStakeAmount) public payable {
        IERC20 asset = lpToAsset[lpToken];
        if (address(asset) == address(0)) revert StargateZapperV1__UnknownLpToken(lpToken);
        if (assetInAmount == 0) revert StargateZapperV1__ZeroAmount();

        _transferInToken(asset, assetInAmount);
        _zapToAndStake(asset, lpToken, assetInAmount, minStakeAmount);
    }

    /**
     * @notice Deposits an asset into a stargate pool and stakes the resulting LP token into the Stargate V2 Staking
     *         contract, all in a single transaction. Does not require approval of the underlying asset of the LP pool,
     *         instead the permit signature of `msg.sender` needs to be provided for the amount.
     * @dev Frontend must use the underlying protocol events to determine the actual amount of the asset received.
     * @dev The `StargatePool` might round down the input amount slightly due to the local decimal to shared decimal
     *      conversion. The frontend must take care of providing properly rounded input amounts as for gas efficiency
     *      this rounding is not refunded. Users are still in control of not receiving less than expected by setting
     *      the minimum received param. If these tokens ever add up to anything, the `owner` can take them out as
     *      fees via `sweep`.
     * @dev This function only works with tokens that support ERC-2612.
     * @dev Not compliant with StargatePoolNative.
     * @param lpToken The V2 LP token to zap into and stake, the underlying asset (such as USDC) of this LP token
     *        is transferred from the transaction sender.
     * @param assetInAmount The amount of the underlying asset (such as USDC) to zap in.
     * @param minStakeAmount The minimum amount of the LP token to stake into the Stargate V2 Staking contract,
     *        as an extra check against rounding slippage and fees.
     * @param deadline The deadline used within the permit data signature (see ERC-2612 for the permit data structure)
     * @param v The v-component of a valid secp256k1 signature from owner of the message
     *        (see ERC-2612 for the permit data structure)
     * @param r The r-component of a valid secp256k1 signature from owner of the message
     *        (see ERC-2612 for the permit data structure)
     * @param s The s-component of a valid secp256k1 signature from owner of the message
     *        (see ERC-2612 for the permit data structure)
     */
    function depositAndStakeWithPermit(
        IERC20 lpToken,
        uint256 assetInAmount,
        uint256 minStakeAmount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        IERC20Permit(address(lpToAsset[lpToken])).permit(msg.sender, address(this), assetInAmount, deadline, v, r, s);
        depositAndStake(lpToken, assetInAmount, minStakeAmount);
    }

    /**
     * @notice Migrates a V1 LP token to V2 and stakes the resulting LP token into the Stargate V2 Staking contract,
     *         all in a single transaction. Requires approval of the V1 LP token.
     * @dev Frontend must use the underlying protocol events to determine the actual amount of the asset received.
     * @dev Compliant with StargatePoolNative.
     * @param poolId The V1 pool ID to migrate from.
     * @param amount The amount of the V1 LP token to migrate.
     * @param minStakeAmount The minimum amount of the V2 LP token to stake into the Stargate V2 Staking contract,
     *        as an extra check against slippage and fees.
     */
    function migrateV1LpToV2Stake(uint16 poolId, uint256 amount, uint256 minStakeAmount) public payable {
        IERC20 v1Lp = v1PidToV1Lp[poolId];
        IERC20 v2Lp = v1PidToV2Lp[poolId];
        IERC20 asset = lpToAsset[v2Lp];
        if (address(v1Lp) == address(0) || address(v2Lp) == address(0) || address(asset) == address(0)) {
            revert StargateZapperV1__InvalidPoolId(poolId);
        }
        if (amount == 0) revert StargateZapperV1__ZeroAmount();

        v1Lp.safeTransferFrom(msg.sender, address(this), amount);
        v1Lp.forceApprove(address(routerV1), amount);
        uint256 amountOut = routerV1.instantRedeemLocal(poolId, amount, address(this));
        if (address(asset) == ETH) {
            // Due to unlp rounding errors, we can't provide `amount` so that this `amountOut` is exactly correct.
            // Hence we need to get rid of the dust ourselves, which can be swept by the admin.
            amountOut -= amountOut % v1PidToConversionRate[poolId];
        }
        _zapToAndStake(asset, v2Lp, amountOut, minStakeAmount);
    }

    /**
     * @notice Migrates a V1 LP token to V2 and stakes the resulting LP token into the Stargate V2 Staking contract,
     *         all in a single transaction. Does not require approval of the V1 LP token, instead the permit signature
     *         of `msg.sender` needs to be provided for the amount.
     * @dev Frontend must use the underlying protocol events to determine the actual amount of the asset received.
     * @dev Not compliant with StargatePoolNative.
     * @param poolId The V1 pool ID to migrate from.
     * @param amount The amount of the V1 LP token to migrate.
     * @param minStakeAmount The minimum amount of the V2 LP token to stake into the Stargate V2 Staking contract,
     *        as an extra check against slippage and fees.
     * @param deadline The deadline used within the permit data signature (see ERC-2612 for the permit data structure)
     * @param v The v-component of a valid secp256k1 signature from owner of the message
     *        (see ERC-2612 for the permit data structure)
     * @param r The r-component of a valid secp256k1 signature from owner of the message
     *        (see ERC-2612 for the permit data structure)
     * @param s The s-component of a valid secp256k1 signature from owner of the message
     *        (see ERC-2612 for the permit data structure)
     */
    function migrateV1LpToV2StakeWithPermit(
        uint16 poolId,
        uint256 amount,
        uint256 minStakeAmount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        IERC20Permit(address(v1PidToV1Lp[poolId])).permit(msg.sender, address(this), amount, deadline, v, r, s);
        migrateV1LpToV2Stake(poolId, amount, minStakeAmount);
    }

    /**
     * @dev Internal function to zap an asset into a stargate pool and stake the resulting LP token into the
     *      Stargate V2 Staking contract, requires the asset to already be in the zapper.
     */
    function _zapToAndStake(IERC20 asset, IERC20 lpToken, uint256 assetInAmount, uint256 minStakeAmount) internal {
        IStargatePool pool = lpToPool[lpToken];
        if (address(pool) == address(0)) revert StargateZapperV1__UnknownLpToken(lpToken);

        uint256 value = 0;
        if (address(asset) == ETH) {
            value = assetInAmount;
        } else {
            asset.forceApprove(address(pool), assetInAmount);
        }
        uint256 amountOut = pool.deposit{ value: value }(address(this), assetInAmount);

        if (amountOut < minStakeAmount) {
            revert StargateZapperV1__InsufficientOutputAmount({ actual: amountOut, expect: minStakeAmount });
        }

        lpToken.forceApprove(address(staking), amountOut);
        staking.depositTo(lpToken, msg.sender, amountOut);
    }

    function _transferInToken(IERC20 token, uint256 amount) internal {
        if (address(token) == ETH) {
            if (msg.value != amount) revert StargateZapperV1__IncorrectNative(msg.value, amount);
        } else {
            token.safeTransferFrom(msg.sender, address(this), amount);
        }
    }

    /**
     * CONFIG & OWNER FUNCTIONS
     */

    /**
     * @notice Whitelist a V2 stargate LP for zapping, configures storage mappings from the LP to the pool and asset
     *         for gas efficiency. Only callable by `owner`.
     * @param lpToken The LP token to set the pool for.
     * @param enabled Whether the pool should be enabled or not.
     */
    function configureLpToken(IERC20 lpToken, bool enabled) external onlyOwner {
        IStargatePool pool = IStargatePool(enabled ? LPToken(address(lpToken)).stargate() : address(0));
        IERC20 asset = IERC20(enabled ? pool.token() : address(0));
        // @dev StargatePoolNative presently sets the .token() to address(0).
        if (enabled && address(asset) == address(0)) asset = IERC20(ETH);

        lpToPool[lpToken] = pool;
        lpToAsset[lpToken] = asset;

        emit LpConfigured(lpToken, pool, asset);
    }

    /**
     * @notice Whitelist a V1 pool ID to a V2 LP token for migration, configures a storage mapping for gas efficiency.
     *         Must be called after `configureLpToken`. Only callable by `owner`.
     * @param v1PoolId The V1 pool ID, specified in the V1 Stargate factory/router.
     * @param v2LpToken The V2 LP token to map to the V1 pool ID, or address(0) to remove the mapping.
     */
    function configureV1Pool(uint16 v1PoolId, IERC20 v2LpToken) external onlyOwner {
        IStargateV1Pool v1LpToken = address(v2LpToken) != address(0)
            ? factoryV1.getPool(v1PoolId)
            : IStargateV1Pool(address(0));

        IERC20 asset = lpToAsset[v2LpToken];
        IERC20 v1LpAsset = address(v2LpToken) != address(0) ? v1LpToken.token() : IERC20(address(0));
        if (
            address(v1LpToken) != address(0) &&
            v1LpAsset != asset &&
            (address(asset) != ETH || address(v1LpAsset) != address(ethVault))
        ) {
            revert StargateZapperV1__UnknownLpToken(v2LpToken);
        }

        uint256 assetDecimals = address(asset) == ETH || address(asset) == address(0)
            ? 18
            : IERC20Metadata(address(asset)).decimals();

        v1PidToV1Lp[v1PoolId] = v1LpToken;
        v1PidToV2Lp[v1PoolId] = v2LpToken;
        v1PidToConversionRate[v1PoolId] = address(v2LpToken) == address(0)
            ? 0
            : 10 ** (assetDecimals - lpToPool[v2LpToken].sharedDecimals());

        emit V1PoolConfigured(v1PoolId, v1LpToken, v2LpToken);
    }

    /**
     * @notice Callable by the owner to withdraw any tokens accidentally sent or stuck in this contract.
     * @param token address of the token to sweep.
     * @param receiver address to receive the tokens.
     * @param amount amount of tokens to sweep.
     */
    function sweep(address token, address receiver, uint256 amount) external onlyOwner {
        if (token == ETH) {
            (bool success, ) = receiver.call{ value: amount }("");
            if (!success) revert StargateZapperV1__NativeTransferFailed();
        } else {
            IERC20(token).safeTransfer(receiver, amount);
        }
        emit TokenSwept(token, receiver, amount);
    }

    // @notice Used For wrapped ETH unwrapping.
    receive() external payable {}
}

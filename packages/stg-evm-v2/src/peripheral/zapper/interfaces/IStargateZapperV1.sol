// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IStakingReceiver } from "../../rewarder/interfaces/IStakingReceiver.sol";
import { IStargatePool } from "../../../interfaces/IStargatePool.sol";

interface IStargateZapperV1 is IStakingReceiver {
    error StargateZapperV1__NativeTransferFailed();
    error StargateZapperV1__InsufficientOutputAmount(uint256 actual, uint256 expect);
    error StargateZapperV1__InvalidPoolId(uint16 poolId);
    error StargateZapperV1__UnknownLpToken(IERC20 lpToken);
    error StargateZapperV1__OnlyCallableByStaking();
    error StargateZapperV1__ZeroAmount();
    error StargateZapperV1__IncorrectNative(uint256 actual, uint256 expect);

    event LpConfigured(IERC20 indexed lpToken, IStargatePool indexed pool, IERC20 asset);
    event V1PoolConfigured(uint16 indexed poolId, IERC20 indexed v1LpToken, IERC20 indexed v2LpToken);
    event TokenSwept(address indexed token, address indexed receiver, uint256 amount);

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
     * @param minStakeAmount The minimum amount of the LP token to stake into the Stargate V2 Staking contract, as
     *        an extra check against rounding slippage and fees.
     */
    function depositAndStake(IERC20 lpToken, uint256 assetInAmount, uint256 minStakeAmount) external payable;

    /**
     * @notice Deposits an asset into a stargate pool and stakes the resulting LP token into the Stargate V2 Staking
     *         contract, all in a single transaction. Does not require approval of the underlying asset of the LP pool,
     *         instead the permit signature of `msg.sender` needs to be provided for the amount.
     * @dev Frontend must use the underlying protocol events to determine the actual amount of the asset received.
     * @dev The `StargatePool` might round down the input amount slightly due to the local decimal to shared decimal
     *      conversion. The frontend must take care of providing properly rounded input amounts as for gas efficiency
     *      this rounding is not refunded. Users are still in control of not receiving less than expected by setting
     *      the minimum received param. If these tokens ever add up to anything, the `owner` can take them out as fees
     *      via `sweep`.
     * @dev This function only works with tokens that support ERC-2612.
     * @dev Not compliant with StargatePoolNative.
     * @param lpToken The V2 LP token to zap into and stake, the underlying asset (such as USDC) of this LP token is
     *        transferred from the transaction sender.
     * @param assetInAmount The amount of the underlying asset (such as USDC) to zap in.
     * @param minStakeAmount The minimum amount of the LP token to stake into the Stargate V2 Staking contract, as
     *        an extra check against rounding slippage and fees.
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
    ) external;

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
    function migrateV1LpToV2Stake(uint16 poolId, uint256 amount, uint256 minStakeAmount) external payable;

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
    ) external;
}

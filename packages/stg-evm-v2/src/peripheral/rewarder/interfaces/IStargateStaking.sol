// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IStakingReceiver } from "./IStakingReceiver.sol";
import { IRewarder } from "./IRewarder.sol";

// @notice The interface to the staking contract for Stargate V2 LPs.
interface IStargateStaking {
    /// @notice StargateStaking renounce ownership is disabled.
    error StargateStakingRenounceOwnershipDisabled();

    /**
     * @notice Thrown on `depositTo` if the caller does not have bytecode, used as an anti-phishing measure to prevent
     *         users from calling `depositTo` as it's for zappers.
     */
    error InvalidCaller();

    /**
     * @notice Thrown on `withdrawToAndCall` if the `to` contract does not return the magic bytes.
     */
    error InvalidReceiver(address receiver);

    error NonExistentPool(IERC20 token);

    event Deposit(IERC20 indexed token, address indexed from, address indexed to, uint256 amount);
    event Withdraw(IERC20 indexed token, address indexed from, address indexed to, uint256 amount, bool withUpdate);
    event PoolSet(IERC20 indexed token, IRewarder rewarder, bool exists);

    /**
     * ADMIN *
     */

    /**
     * @notice Configures the rewarder for a pool. This will initialize the pool if it does not exist yet,
     *         whitelisting it for deposits.
     */
    function setPool(IERC20 token, IRewarder rewarder) external;

    /**
     * USER *
     */

    /**
     * @notice Deposits `amount` of `token` into the pool. Informs the rewarder of the deposit, triggering a harvest.
     */
    function deposit(IERC20 token, uint256 amount) external;

    /**
     * @notice Deposits `amount` of `token` into the pool for `to`. Informs the rewarder of the deposit, triggering a
     *         harvest. This function can only be called by a contract, as to prevent phishing by a malicious contract.
     * @dev This function is useful for zappers, as it allows to do multiple steps ending with a deposit,
     *      without the need to do multiple transactions.
     */
    function depositTo(IERC20 token, address to, uint256 amount) external;

    /// @notice Withdraws `amount` of `token` from the pool. Informs the rewarder of the withdrawal, triggers a harvest.
    function withdraw(IERC20 token, uint256 amount) external;

    /**
     * @notice Withdraws `amount` of `token` from the pool for `to`, and subsequently calls the receipt function on the
     *         `to` contract. Informs the rewarder of the withdrawal, triggering a harvest.
     * @dev This function is useful for zappers, as it allows to do multiple steps ending with a deposit,
     *      without the need to do multiple transactions.
     */
    function withdrawToAndCall(IERC20 token, IStakingReceiver to, uint256 amount, bytes calldata data) external;

    /// @notice Withdraws `amount` of `token` from the pool in an always-working fashion. The rewarder is not informed.
    function emergencyWithdraw(IERC20 token) external;

    /// @notice Claims the rewards from the rewarder, and sends them to the caller.
    function claim(IERC20[] calldata lpTokens) external;

    /**
     * VIEW *
     */

    /// @notice Returns the deposited balance of `user` in the pool of `token`.
    function balanceOf(IERC20 token, address user) external view returns (uint256);

    /// @notice Returns the total supply of the pool of `token`.
    function totalSupply(IERC20 token) external view returns (uint256);

    /// @notice Returns whether `token` is a pool.
    function isPool(IERC20 token) external view returns (bool);

    /// @notice Returns the number of pools.
    function tokensLength() external view returns (uint256);

    /// @notice Returns the list of pools, by their staking tokens.
    function tokens() external view returns (IERC20[] memory);

    /// @notice Returns a slice of the list of pools, by their staking tokens.
    function tokens(uint256 start, uint256 end) external view returns (IERC20[] memory);

    // @notice Returns the rewarder of the pool of `token`, responsible for distribution reward tokens.
    function rewarder(IERC20 token) external view returns (IRewarder);
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 *  @notice A rewarder is connected to the staking contract and distributes rewards whenever the staking contract
 *          updates the rewarder.
 */
interface IRewarder {
    /**
     *  @notice This function is only callable by the staking contract.
     */
    error MultiRewarderUnauthorizedCaller(address caller);
    /**
     *  @notice The rewarder cannot be reconnected to the same staking token as it would cause wrongful reward
     *          attribution through reconfiguration.
     */
    error RewarderAlreadyConnected(IERC20 stakingToken);

    /**
     *  @notice Emitted when the rewarder is connected to a staking token.
     */
    event RewarderConnected(IERC20 indexed stakingToken);

    /**
     *  @notice Informs the rewarder of an update in the staking contract, such as a deposit, withdraw or claim.
     *  @dev Emergency withdrawals draw the balance of a user to 0, and DO NOT call `onUpdate`.
     *       The rewarder logic must keep this in mind!
     */
    function onUpdate(IERC20 token, address user, uint256 oldStake, uint256 oldSupply, uint256 newStake) external;

    /**
     *  @notice Called by the staking contract whenever this rewarder is connected to a staking token in the staking
     *          contract. Should only be callable once per staking token to avoid wrongful reward attribution through
     *          reconfiguration.
     */
    function connect(IERC20 stakingToken) external;
}

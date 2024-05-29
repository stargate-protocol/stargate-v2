// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { IRewarder, IERC20 } from "../../src/peripheral/rewarder/interfaces/IRewarder.sol";

contract RewarderMock is IRewarder {
    bool public reverting;

    function setRevert(bool _reverting) external {
        reverting = _reverting;
    }

    function onUpdate(
        IERC20 /*token*/,
        address /*user*/,
        uint256 /*oldStake*/,
        uint256 /*oldSupply*/,
        uint256 /*newStake*/
    ) external view {
        if (reverting) {
            revert("RewarderMock: revert");
        }
    }

    function configureReward(IERC20 rewardToken, uint256 rewards, uint256 start, uint256 duration) external {}
    function retireReward(IERC20 rewardToken, address receiver) external {}
    function connect(IERC20 stakingToken) external {}
}

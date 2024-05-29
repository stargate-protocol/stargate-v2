// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IMultiRewarder, RewardPool } from "../interfaces/IMultiRewarder.sol";

/// @dev Library which handles staking rewards.
library RewardLib {
    uint256 private constant PRECISION = 10 ** 24;

    function indexAndUpdate(
        RewardPool storage pool,
        IMultiRewarder.RewardDetails storage rewardDetails,
        address user,
        uint256 oldStake,
        uint256 totalSupply
    ) internal returns (uint256) {
        uint256 accRewardPerShare = index(pool, rewardDetails, totalSupply);
        return update(pool, user, oldStake, accRewardPerShare);
    }

    function update(
        RewardPool storage pool,
        address user,
        uint256 oldStake,
        uint256 accRewardPerShare
    ) internal returns (uint256) {
        uint256 rewardsForUser = ((accRewardPerShare - pool.rewardDebt[user]) * oldStake) / PRECISION;
        pool.rewardDebt[user] = accRewardPerShare;
        return rewardsForUser;
    }

    function index(
        RewardPool storage pool,
        IMultiRewarder.RewardDetails storage rewardDetails,
        uint256 totalSupply
    ) internal returns (uint256 accRewardPerShare) {
        accRewardPerShare = _index(pool, rewardDetails, totalSupply);
        pool.accRewardPerShare = accRewardPerShare;
        pool.lastRewardTime = uint48(block.timestamp);
    }

    function _index(
        RewardPool storage pool,
        IMultiRewarder.RewardDetails storage rewardDetails,
        uint256 totalSupply
    ) internal view returns (uint256) {
        // max(start, lastRewardTime)
        uint256 start = rewardDetails.start > pool.lastRewardTime ? rewardDetails.start : pool.lastRewardTime;
        // min(end, now)
        uint256 end = rewardDetails.end < block.timestamp ? rewardDetails.end : block.timestamp;
        if (start >= end || totalSupply == 0 || rewardDetails.totalAllocPoints == 0) {
            return pool.accRewardPerShare;
        }

        return
            (rewardDetails.rewardPerSec * (end - start) * pool.allocPoints * PRECISION) /
            rewardDetails.totalAllocPoints /
            totalSupply +
            pool.accRewardPerShare;
    }

    function getRewards(
        RewardPool storage pool,
        IMultiRewarder.RewardDetails storage rewardDetails,
        address user,
        uint256 oldStake,
        uint256 oldSupply
    ) internal view returns (uint256) {
        uint256 accRewardPerShare = _index(pool, rewardDetails, oldSupply);
        return ((accRewardPerShare - pool.rewardDebt[user]) * oldStake) / PRECISION;
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import { IMultiRewarder, RewardPool, IERC20 } from "../interfaces/IMultiRewarder.sol";

/// @dev Internal representation for a staking pool.
struct RewardRegistry {
    uint256 rewardIdCount;
    mapping(uint256 => RewardPool) pools;
    mapping(address rewardToken => EnumerableSet.UintSet) byReward;
    mapping(IERC20 stakingToken => EnumerableSet.UintSet) byStake;
    mapping(address rewardToken => mapping(IERC20 stakingToken => uint256)) byRewardAndStake;
    mapping(address rewardToken => IMultiRewarder.RewardDetails) rewardDetails;
    EnumerableSet.AddressSet rewardTokens;
    mapping(IERC20 stakingToken => bool) connected;
}

/// @dev Library for staking pool logic.
library RewardRegistryLib {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 private constant MAX_ACTIVE_POOLS_PER_REWARD = 100;
    uint256 private constant MAX_ACTIVE_REWARD_TOKENS = 100;

    //** REGISTRY ADJUSTMENTS **/
    function getOrCreateRewardDetails(
        RewardRegistry storage self,
        address rewardToken
    ) internal returns (IMultiRewarder.RewardDetails storage reward) {
        reward = self.rewardDetails[rewardToken];
        if (!reward.exists) {
            if (self.rewardTokens.length() >= MAX_ACTIVE_REWARD_TOKENS) {
                revert IMultiRewarder.MultiRewarderMaxActiveRewardTokens();
            }
            reward.exists = true;
            self.rewardTokens.add(rewardToken);
            emit IMultiRewarder.RewardRegistered(rewardToken);
        }
    }

    function getOrCreatePoolId(
        RewardRegistry storage self,
        address reward,
        IERC20 stake
    ) internal returns (uint256 poolId) {
        poolId = self.byRewardAndStake[reward][stake];
        if (poolId == 0) {
            if (self.byReward[reward].length() >= MAX_ACTIVE_POOLS_PER_REWARD) {
                revert IMultiRewarder.MultiRewarderMaxPoolsForRewardToken();
            }
            if (!self.connected[stake]) {
                revert IMultiRewarder.MultiRewarderDisconnectedStakingToken(address(stake));
            }
            poolId = ++self.rewardIdCount; // Start at 1
            self.byRewardAndStake[reward][stake] = poolId;
            self.byReward[reward].add(poolId);
            self.byStake[stake].add(poolId);
            self.pools[poolId].rewardToken = reward;
            self.pools[poolId].stakingToken = stake;
            self.pools[poolId].lastRewardTime = uint48(block.timestamp);

            emit IMultiRewarder.PoolRegistered(reward, stake);
        }
    }

    function removeReward(RewardRegistry storage self, address rewardToken) internal {
        if (!self.rewardDetails[rewardToken].exists) revert IMultiRewarder.MultiRewarderUnregisteredToken(rewardToken);
        uint256[] memory ids = self.byReward[rewardToken].values();
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            IERC20 stakingToken = self.pools[id].stakingToken;

            self.byStake[stakingToken].remove(id);
            self.byReward[rewardToken].remove(id);
            self.byRewardAndStake[rewardToken][stakingToken] = 0;
            self.pools[id].removed = true;
        }
        self.rewardTokens.remove(rewardToken);
        delete self.rewardDetails[rewardToken];
    }

    function setAllocPoints(
        RewardRegistry storage self,
        address rewardToken,
        IERC20[] calldata stakingTokens,
        uint48[] calldata allocPoints
    ) internal {
        IMultiRewarder.RewardDetails storage reward = getOrCreateRewardDetails(self, rewardToken);
        uint160 totalSubtract;
        uint160 totalAdd;
        uint256 length = stakingTokens.length;
        for (uint256 i = 0; i < length; i++) {
            uint256 id = getOrCreatePoolId(self, rewardToken, stakingTokens[i]);
            totalSubtract += self.pools[id].allocPoints;
            totalAdd += allocPoints[i];
            self.pools[id].allocPoints = allocPoints[i];
        }

        reward.totalAllocPoints = reward.totalAllocPoints + totalAdd - totalSubtract;
    }

    //** VIEW FUNCTIONS **/

    function allocPointsByReward(
        RewardRegistry storage self,
        address rewardToken
    ) internal view returns (IERC20[] memory stakingTokens, uint48[] memory allocPoints) {
        uint256[] memory ids = self.byReward[rewardToken].values();
        stakingTokens = new IERC20[](ids.length);
        allocPoints = new uint48[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            stakingTokens[i] = self.pools[ids[i]].stakingToken;
            allocPoints[i] = self.pools[ids[i]].allocPoints;
        }
    }

    function allocPointsByStake(
        RewardRegistry storage self,
        IERC20 stakingToken
    ) internal view returns (address[] memory rewardTokens, uint48[] memory allocPoints) {
        uint256[] memory ids = self.byStake[stakingToken].values();
        rewardTokens = new address[](ids.length);
        allocPoints = new uint48[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            rewardTokens[i] = self.pools[ids[i]].rewardToken;
            allocPoints[i] = self.pools[ids[i]].allocPoints;
        }
    }
}

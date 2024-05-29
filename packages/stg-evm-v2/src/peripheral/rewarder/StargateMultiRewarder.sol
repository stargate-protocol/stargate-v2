// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IStargateStaking } from "./interfaces/IStargateStaking.sol";
import { IMultiRewarder, IERC20 } from "./interfaces/IMultiRewarder.sol";
import { RewardLib, RewardPool } from "./lib/RewardLib.sol";
import { RewardRegistryLib, RewardRegistry } from "./lib/RewardRegistryLib.sol";

/// @notice See `IMultiRewarder` and `IRewarder` for documentation.
contract StargateMultiRewarder is Ownable, IMultiRewarder {
    using RewardLib for RewardPool;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using RewardRegistryLib for RewardRegistry;
    using SafeCast for uint256;
    using SafeERC20 for IERC20;

    address private constant ETH = address(0);

    RewardRegistry private registry;
    IStargateStaking public immutable staking;

    modifier onlyStaking() {
        if (msg.sender != address(staking)) revert MultiRewarderUnauthorizedCaller(msg.sender);
        _;
    }

    constructor(IStargateStaking _staking) {
        staking = _staking;
    }

    //** STAKING FUNCTIONS **/

    function onUpdate(
        IERC20 stakingToken,
        address user,
        uint256 oldStake,
        uint256 oldSupply,
        uint256 /*newStake*/
    ) external onlyStaking {
        uint256[] memory ids = registry.byStake[stakingToken].values();
        address[] memory tokens = new address[](ids.length);
        uint256[] memory amounts = new uint256[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            RewardPool storage pool = registry.pools[ids[i]];
            address rewardToken = pool.rewardToken;
            tokens[i] = rewardToken;
            amounts[i] = pool.indexAndUpdate(registry.rewardDetails[rewardToken], user, oldStake, oldSupply);
        }

        emit RewardsClaimed(user, tokens, amounts);

        for (uint256 i = 0; i < ids.length; i++) {
            if (amounts[i] > 0) {
                _transferToken(user, tokens[i], amounts[i]);
            }
        }
    }

    function connect(IERC20 stakingToken) external onlyStaking {
        if (registry.connected[stakingToken]) revert RewarderAlreadyConnected(stakingToken);
        registry.connected[stakingToken] = true;
        emit RewarderConnected(stakingToken);
    }

    function _indexRewardTokenPools(address rewardToken) internal {
        uint256 numPools = registry.byReward[rewardToken].length();
        for (uint256 i = 0; i < numPools; i++) {
            RewardPool storage pool = registry.pools[registry.byReward[rewardToken].at(i)];
            pool.index(registry.rewardDetails[rewardToken], staking.totalSupply(pool.stakingToken));
        }
    }

    /**
     * ADMIN FUNCTIONS *
     */
    function extendReward(address rewardToken, uint256 amount) external payable onlyOwner {
        RewardDetails storage reward = registry.rewardDetails[rewardToken];
        if (!reward.exists) revert MultiRewarderUnregisteredToken(rewardToken);
        if (reward.end < block.timestamp) revert MultiRewarderPoolFinished(rewardToken);

        reward.end += (amount / reward.rewardPerSec).toUint48();

        emit RewardExtended(rewardToken, amount, reward.end);

        _transferInToken(rewardToken, amount);
    }

    function setReward(address rewardToken, uint256 amount, uint48 start, uint48 duration) external payable onlyOwner {
        if (start < block.timestamp) revert MultiRewarderStartInPast(start);
        if (duration == 0) revert MultiRewarderZeroDuration();
        RewardDetails storage reward = registry.getOrCreateRewardDetails(rewardToken);
        _indexRewardTokenPools(rewardToken);

        uint256 rewardsToAdd = amount;
        if (block.timestamp < reward.end) {
            uint256 previousStart = reward.start > block.timestamp ? reward.start : block.timestamp;
            rewardsToAdd += reward.rewardPerSec * (reward.end - previousStart);
        }

        uint256 rewardPerSec = rewardsToAdd / duration;
        if (rewardPerSec == 0) revert MultiRewarderZeroRewardRate();

        reward.start = start;
        reward.end = start + duration;
        reward.rewardPerSec = rewardPerSec;

        emit RewardSet(rewardToken, amount, rewardsToAdd, start, duration);

        _transferInToken(rewardToken, amount);
    }

    function setAllocPoints(
        address rewardToken,
        IERC20[] calldata stakingTokens,
        uint48[] calldata allocPoints
    ) external onlyOwner {
        _indexRewardTokenPools(rewardToken);
        registry.setAllocPoints(rewardToken, stakingTokens, allocPoints);
        emit AllocPointsSet(rewardToken, stakingTokens, allocPoints);
    }

    function stopReward(address rewardToken, address receiver, bool pullTokens) external onlyOwner {
        registry.removeReward(rewardToken);
        /**
         * @dev we provide pullTokens as we especially need to be able to retire rewards even if the token transfers
         *      revert for some reason.
         */
        if (pullTokens) {
            uint256 amount = rewardToken == ETH ? address(this).balance : IERC20(rewardToken).balanceOf(address(this));
            _transferToken(receiver, rewardToken, amount);
        }
        emit RewardStopped(rewardToken, receiver, pullTokens);
    }

    function renounceOwnership() public view override onlyOwner {
        revert MultiRewarderRenounceOwnershipDisabled();
    }

    /**
     * UTILITIES *
     */
    function _transferToken(address to, address token, uint256 amount) internal {
        if (token == ETH) {
            (bool success, ) = to.call{ value: amount }("");
            if (!success) revert MultiRewarderNativeTransferFailed(token, amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function _transferInToken(address token, uint256 amount) internal {
        if (token == ETH) {
            if (msg.value != amount) revert MultiRewarderIncorrectNative(amount, msg.value);
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
    }

    /**
     * VIEW FUNCTIONS *
     */
    function getRewards(IERC20 stakingToken, address user) external view returns (address[] memory, uint256[] memory) {
        uint256[] memory ids = registry.byStake[stakingToken].values();
        address[] memory tokens = new address[](ids.length);
        uint256[] memory amounts = new uint256[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            RewardPool storage pool = registry.pools[ids[i]];
            RewardDetails storage reward = registry.rewardDetails[pool.rewardToken];
            tokens[i] = pool.rewardToken;
            amounts[i] = pool.getRewards(
                reward,
                user,
                staking.balanceOf(pool.stakingToken, user),
                staking.totalSupply(pool.stakingToken)
            );
        }
        return (tokens, amounts);
    }

    function allocPointsByReward(address rewardToken) external view returns (IERC20[] memory, uint48[] memory) {
        return registry.allocPointsByReward(rewardToken);
    }

    function allocPointsByStake(IERC20 stakingToken) external view returns (address[] memory, uint48[] memory) {
        return registry.allocPointsByStake(stakingToken);
    }

    function rewardDetails(address rewardToken) external view returns (RewardDetails memory) {
        return registry.rewardDetails[rewardToken];
    }

    function rewardTokens() external view override returns (address[] memory) {
        return registry.rewardTokens.values();
    }
}

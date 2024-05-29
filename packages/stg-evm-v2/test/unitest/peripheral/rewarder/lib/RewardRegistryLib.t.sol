// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { StargateBaseTest, console } from "../../../stargate/StargateBase.t.sol";
import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import { RewardRegistryLib, RewardRegistry, IMultiRewarder, RewardPool, IERC20 } from "../../../../../src/peripheral/rewarder/lib/RewardRegistryLib.sol";

/// @dev Note that we cannot test the alloc point setter due to it having calldata parameters, these must be integration tested.
contract RewardRegistryLibTest is StargateBaseTest {
    using RewardRegistryLib for RewardRegistry;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    address alice = vm.addr(101);
    address bob = vm.addr(102);
    address rewardToken1 = vm.addr(201);
    IERC20 stakingToken1 = IERC20(vm.addr(301));
    IERC20 stakingToken2 = IERC20(vm.addr(302));

    RewardRegistry registry;

    function test_getOrCreateRewardDetails() public {
        //assertEq(registry.rewardDetails[rewardToken1].lastRewardTime, 0);
        //assertEq(registry.rewardDetails[rewardToken1].rewardToken, address(0));
        //assertEq(address(registry.rewardDetails[rewardToken1].stakingToken), address(0));
        assertEq(registry.rewardDetails[rewardToken1].rewardPerSec, 0);
        assertEq(registry.rewardDetails[rewardToken1].totalAllocPoints, 0);
        assertEq(registry.rewardDetails[rewardToken1].start, 0);
        assertEq(registry.rewardDetails[rewardToken1].end, 0);
        assertEq(registry.rewardDetails[rewardToken1].exists, false);
        assertEq(registry.rewardTokens.length(), 0);
        vm.record();
        IMultiRewarder.RewardDetails storage rewardDetails = registry.getOrCreateRewardDetails(rewardToken1);
        (bytes32[] memory r, bytes32[] memory w) = vm.accesses(address(this));
        assertGt(r.length, 0);
        assertGt(w.length, 0);
        assertEq(registry.rewardDetails[rewardToken1].rewardPerSec, 0);
        assertEq(registry.rewardDetails[rewardToken1].totalAllocPoints, 0);
        assertEq(registry.rewardDetails[rewardToken1].start, 0);
        assertEq(registry.rewardDetails[rewardToken1].end, 0);
        assertEq(registry.rewardDetails[rewardToken1].exists, true);
        assertEq(rewardDetails.rewardPerSec, 0);
        assertEq(rewardDetails.totalAllocPoints, 0);
        assertEq(rewardDetails.start, 0);
        assertEq(rewardDetails.end, 0);
        assertEq(rewardDetails.exists, true);
        assertEq(registry.rewardTokens.length(), 1);
        assertEq(registry.rewardTokens.at(0), rewardToken1);

        vm.record();
        rewardDetails = registry.getOrCreateRewardDetails(rewardToken1);
        (r, w) = vm.accesses(address(this));
        assertGt(r.length, 0);
        assertEq(w.length, 0);
        assertEq(registry.rewardTokens.length(), 1);
        assertEq(registry.rewardTokens.at(0), rewardToken1);
    }

    function test_revert_getOrCreateRewardDetailsAfterCap() public {
        for (uint256 i = 0; i < 100; i++) {
            IMultiRewarder.RewardDetails storage rewardDetails = registry.getOrCreateRewardDetails(vm.addr(201 + i));
            assertEq(rewardDetails.exists, true);
        }

        assertEq(registry.rewardTokens.length(), 100);
        for (uint256 i = 0; i < 100; i++) {
            assertTrue(registry.rewardTokens.contains(vm.addr(201 + i)));
        }

        vm.expectRevert(IMultiRewarder.MultiRewarderMaxActiveRewardTokens.selector);
        registry.getOrCreateRewardDetails(vm.addr(1000));
    }

    function test_getOrCreateRewardDetailsPossibleAfterRemovalFromCap() public {
        for (uint256 i = 0; i < 100; i++) {
            IMultiRewarder.RewardDetails storage rewardDetails = registry.getOrCreateRewardDetails(vm.addr(201 + i));
            assertEq(rewardDetails.exists, true);
        }

        assertEq(registry.rewardTokens.length(), 100);
        for (uint256 i = 0; i < 100; i++) {
            assertTrue(registry.rewardTokens.contains(vm.addr(201 + i)));
        }

        registry.removeReward(vm.addr(250));
        assertEq(registry.rewardTokens.length(), 99);
        assertFalse(registry.rewardTokens.contains(vm.addr(250)));
        for (uint256 i = 0; i < 100; i++) {
            if (201 + i != 250) {
                assertTrue(registry.rewardTokens.contains(vm.addr(201 + i)));
            }
        }

        registry.getOrCreateRewardDetails(vm.addr(1000));

        assertEq(registry.rewardTokens.length(), 100);
        assertFalse(registry.rewardTokens.contains(vm.addr(250)));
        assertTrue(registry.rewardTokens.contains(vm.addr(1000)));
        for (uint256 i = 0; i < 100; i++) {
            if (201 + i != 250) {
                assertTrue(registry.rewardTokens.contains(vm.addr(201 + i)));
            }
        }

        registry.removeReward(vm.addr(1000));
        registry.getOrCreateRewardDetails(vm.addr(250));

        assertEq(registry.rewardTokens.length(), 100);
        for (uint256 i = 0; i < 100; i++) {
            assertTrue(registry.rewardTokens.contains(vm.addr(201 + i)));
        }

        registry.removeReward(vm.addr(201));
        assertEq(registry.rewardTokens.length(), 99);
        assertFalse(registry.rewardTokens.contains(vm.addr(201)));
        for (uint256 i = 0; i < 100; i++) {
            if (201 + i != 201) {
                assertTrue(registry.rewardTokens.contains(vm.addr(201 + i)));
            }
        }
    }

    function test_getOrCreatePoolId() public {
        assertEq(registry.byRewardAndStake[rewardToken1][stakingToken1], 0);
        assertEq(registry.byReward[rewardToken1].length(), 0);
        assertEq(registry.byStake[stakingToken1].length(), 0);
        assertEq(registry.rewardIdCount, 0);
        assertEq(registry.pools[1].rewardToken, address(0));
        assertEq(address(registry.pools[1].stakingToken), address(0));
        assertEq(registry.pools[1].lastRewardTime, 0);

        registry.connected[stakingToken1] = true;
        vm.record();
        uint256 poolId = registry.getOrCreatePoolId(rewardToken1, stakingToken1);
        (bytes32[] memory r, bytes32[] memory w) = vm.accesses(address(this));
        assertGt(r.length, 0);
        assertGt(w.length, 0);
        assertEq(poolId, 1);
        assertEq(registry.byRewardAndStake[rewardToken1][stakingToken1], 1);
        assertEq(registry.byReward[rewardToken1].length(), 1);
        assertEq(registry.byReward[rewardToken1].at(0), 1);
        assertEq(registry.byStake[stakingToken1].length(), 1);
        assertEq(registry.byStake[stakingToken1].at(0), 1);
        assertEq(registry.rewardIdCount, 1);
        assertEq(registry.pools[1].rewardToken, rewardToken1);
        assertEq(address(registry.pools[1].stakingToken), address(stakingToken1));
        assertEq(registry.pools[1].lastRewardTime, block.timestamp);

        vm.record();
        poolId = registry.getOrCreatePoolId(rewardToken1, stakingToken1);
        (r, w) = vm.accesses(address(this));
        assertGt(r.length, 0);
        assertEq(w.length, 0);
        assertEq(poolId, 1);
        assertEq(registry.byRewardAndStake[rewardToken1][stakingToken1], 1);
        assertEq(registry.byReward[rewardToken1].length(), 1);
        assertEq(registry.byReward[rewardToken1].at(0), 1);
        assertEq(registry.byStake[stakingToken1].length(), 1);
        assertEq(registry.byStake[stakingToken1].at(0), 1);
        assertEq(registry.rewardIdCount, 1);
        assertEq(registry.pools[1].rewardToken, rewardToken1);
        assertEq(address(registry.pools[1].stakingToken), address(stakingToken1));
        assertEq(registry.pools[1].lastRewardTime, block.timestamp);

        // staking token 2
        registry.connected[stakingToken2] = true;
        poolId = registry.getOrCreatePoolId(rewardToken1, stakingToken2);
        assertEq(poolId, 2);
        assertEq(registry.byRewardAndStake[rewardToken1][stakingToken2], 2);
        assertEq(registry.byReward[rewardToken1].length(), 2);
        assertEq(registry.byReward[rewardToken1].at(1), 2);
        assertEq(registry.byStake[stakingToken2].length(), 1);
        assertEq(registry.byStake[stakingToken2].at(0), 2);
        assertEq(registry.rewardIdCount, 2);
        assertEq(registry.pools[2].rewardToken, rewardToken1);
        assertEq(address(registry.pools[2].stakingToken), address(stakingToken2));
        assertEq(registry.pools[2].lastRewardTime, block.timestamp);
    }

    function test_revert_getOrCreatePoolIdDetailsAfterCap() public {
        for (uint256 i = 0; i < 100; i++) {
            IERC20 stakingToken = IERC20(vm.addr(301 + i));
            skip(12);
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], 0);
            assertEq(registry.byReward[rewardToken1].length(), i);
            assertEq(registry.byStake[stakingToken].length(), 0);
            assertEq(registry.rewardIdCount, i);
            assertEq(registry.pools[i + 1].rewardToken, address(0));
            assertEq(address(registry.pools[i + 1].stakingToken), address(0));
            assertEq(registry.pools[i + 1].lastRewardTime, 0);

            registry.connected[stakingToken] = true;
            uint256 poolId = registry.getOrCreatePoolId(rewardToken1, stakingToken);
            assertEq(poolId, i + 1);
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], i + 1);
            assertEq(registry.byReward[rewardToken1].length(), i + 1);
            assertEq(registry.byReward[rewardToken1].at(i), i + 1);
            assertEq(registry.byStake[stakingToken].length(), 1);
            assertEq(registry.byStake[stakingToken].at(0), i + 1);
            assertEq(registry.rewardIdCount, i + 1);
            assertEq(registry.pools[i + 1].rewardToken, rewardToken1);
            assertEq(address(registry.pools[i + 1].stakingToken), address(stakingToken));
            assertEq(registry.pools[i + 1].lastRewardTime, block.timestamp);
        }

        assertEq(registry.rewardTokens.length(), 0); // because not registered (this is enforced in the actual contract tho)
        assertEq(registry.byReward[rewardToken1].length(), 100);
        assertEq(registry.rewardIdCount, 100);
        for (uint256 i = 0; i < 100; i++) {
            IERC20 stakingToken = IERC20(vm.addr(301 + i));
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], i + 1);
            assertEq(registry.byReward[rewardToken1].at(i), i + 1);
            assertEq(registry.byStake[stakingToken].length(), 1);
            assertEq(registry.byStake[stakingToken].at(0), i + 1);
            assertEq(registry.pools[i + 1].rewardToken, rewardToken1);
            assertEq(address(registry.pools[i + 1].stakingToken), address(stakingToken));
        }

        vm.expectRevert(IMultiRewarder.MultiRewarderMaxPoolsForRewardToken.selector);
        registry.getOrCreatePoolId(rewardToken1, IERC20(vm.addr(1000)));
    }

    function test_getOrCreatePoolIdDetailsAfterCapPossibleAfterRemoval() public {
        IMultiRewarder.RewardDetails storage rewardDetails = registry.getOrCreateRewardDetails(rewardToken1);
        for (uint256 i = 0; i < 100; i++) {
            IERC20 stakingToken = IERC20(vm.addr(301 + i));
            skip(12);
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], 0);
            assertEq(registry.byReward[rewardToken1].length(), i);
            assertEq(registry.byStake[stakingToken].length(), 0);
            assertEq(registry.rewardIdCount, i);
            assertEq(registry.pools[i + 1].rewardToken, address(0));
            assertEq(address(registry.pools[i + 1].stakingToken), address(0));
            assertEq(registry.pools[i + 1].lastRewardTime, 0);

            registry.connected[stakingToken] = true;
            uint256 poolId = registry.getOrCreatePoolId(rewardToken1, stakingToken);
            assertEq(poolId, i + 1);
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], i + 1);
            assertEq(registry.byReward[rewardToken1].length(), i + 1);
            assertEq(registry.byReward[rewardToken1].at(i), i + 1);
            assertEq(registry.byStake[stakingToken].length(), 1);
            assertEq(registry.byStake[stakingToken].at(0), i + 1);
            assertEq(registry.rewardIdCount, i + 1);
            assertEq(registry.pools[i + 1].rewardToken, rewardToken1);
            assertEq(address(registry.pools[i + 1].stakingToken), address(stakingToken));
            assertEq(registry.pools[i + 1].lastRewardTime, block.timestamp);
        }

        assertEq(registry.rewardTokens.length(), 1);
        assertEq(registry.rewardTokens.at(0), rewardToken1);
        assertEq(registry.byReward[rewardToken1].length(), 100);
        assertEq(registry.rewardIdCount, 100);
        assertEq(rewardDetails.exists, true);
        for (uint256 i = 0; i < 100; i++) {
            IERC20 stakingToken = IERC20(vm.addr(301 + i));
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], i + 1);
            assertEq(registry.byReward[rewardToken1].at(i), i + 1);
            assertEq(registry.byStake[stakingToken].length(), 1);
            assertEq(registry.byStake[stakingToken].at(0), i + 1);
            assertEq(registry.pools[i + 1].rewardToken, rewardToken1);
            assertEq(registry.pools[i + 1].removed, false);
            assertEq(address(registry.pools[i + 1].stakingToken), address(stakingToken));
        }

        registry.removeReward(rewardToken1);
        assertEq(registry.rewardTokens.length(), 0);
        assertEq(registry.byReward[rewardToken1].length(), 0);
        assertEq(rewardDetails.exists, false);
        assertEq(rewardDetails.rewardPerSec, 0);
        assertEq(rewardDetails.totalAllocPoints, 0);
        assertEq(rewardDetails.start, 0);
        assertEq(rewardDetails.end, 0);
        for (uint256 i = 0; i < 100; i++) {
            IERC20 stakingToken = IERC20(vm.addr(301 + i));
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], 0);
            assertEq(registry.byStake[stakingToken].length(), 0);
            assertEq(registry.pools[i + 1].removed, true);
        }
        rewardDetails = registry.getOrCreateRewardDetails(rewardToken1);
        for (uint256 i = 0; i < 100; i++) {
            IERC20 stakingToken = IERC20(vm.addr(301 + i));
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], 0);
            assertEq(registry.byReward[rewardToken1].length(), i);
            assertEq(registry.byStake[stakingToken].length(), 0);
            assertEq(registry.rewardIdCount, 100 + i);
            assertEq(registry.pools[i + 101].rewardToken, address(0));
            assertEq(address(registry.pools[i + 101].stakingToken), address(0));
            assertEq(registry.pools[i + 101].lastRewardTime, 0);
            uint256 poolId = registry.getOrCreatePoolId(rewardToken1, stakingToken);
            assertEq(poolId, i + 101);
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], i + 101);
            assertEq(registry.byReward[rewardToken1].length(), i + 1);
            assertEq(registry.byReward[rewardToken1].at(i), i + 101);
            assertEq(registry.byStake[stakingToken].length(), 1);
            assertEq(registry.byStake[stakingToken].at(0), i + 101);
            assertEq(registry.rewardIdCount, i + 101);
            assertEq(registry.pools[i + 101].rewardToken, rewardToken1);
            assertEq(address(registry.pools[i + 101].stakingToken), address(stakingToken));
            assertEq(registry.pools[i + 101].lastRewardTime, block.timestamp);
        }

        assertEq(registry.rewardTokens.length(), 1);
        assertEq(registry.rewardTokens.at(0), rewardToken1);
        assertEq(registry.byReward[rewardToken1].length(), 100);
        assertEq(registry.rewardIdCount, 200);
        assertEq(rewardDetails.exists, true);
        for (uint256 i = 0; i < 100; i++) {
            IERC20 stakingToken = IERC20(vm.addr(301 + i));
            assertEq(registry.byRewardAndStake[rewardToken1][stakingToken], i + 101);
            assertEq(registry.byReward[rewardToken1].at(i), i + 101);
            assertEq(registry.byStake[stakingToken].length(), 1);
            assertEq(registry.byStake[stakingToken].at(0), i + 101);
            assertEq(registry.pools[i + 101].rewardToken, rewardToken1);
            assertEq(registry.pools[i + 101].removed, false);
            assertEq(address(registry.pools[i + 101].stakingToken), address(stakingToken));
        }
    }
}

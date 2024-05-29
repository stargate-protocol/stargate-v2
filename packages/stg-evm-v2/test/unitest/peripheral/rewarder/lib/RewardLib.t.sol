// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { StargateBaseTest, console } from "../../../stargate/StargateBase.t.sol";

import { RewardLib, IMultiRewarder, RewardPool } from "../../../../../src/peripheral/rewarder/lib/RewardLib.sol";

/// @dev this library test is specifically done to ensure our precision params are reasonable.
/// @dev Overflow consideration:
///     - `rewardDetails.rewardPerSec * time * 1e24  * allocpoints` should not overflow
///     - max alloc point: 281474976710655
///     - assume max time: 1 year, 31536000
///     - max uint256: 2^256 - 1
///     -> max reward rate: 13044651805248064816095244373016 = 13_044_651_805_248 1e18.
/// @dev High decimals reward tokens are probably going to revert.
contract RewardLibTest is StargateBaseTest {
    using RewardLib for RewardPool;

    address alice = address(vm.addr(101));
    address bob = address(vm.addr(102));

    RewardPool pool;
    IMultiRewarder.RewardDetails rewardDetails;

    /// @dev We distribute an 1e6 stable to 225M 1e18 stakes at 0.5% APR (realistic extrema case for low reward/stake ratio)
    /// @dev Conclusion: 1e24 precision is accurate enough, some loss is happening due to rounding which could be avoided with eg. 1e32, but then we start needing mulDiv potentially to avoid overflow errors.
    function test_updatePrecision6decReward18DecStake() public {
        uint256 rewards = 100_000 * 1e6; // 385 rewards per second
        uint48 start = uint48(block.timestamp);
        uint48 duration = 24 * 3600 * 30;
        uint48 end = start + duration;
        rewardDetails.rewardPerSec = rewards / duration; // 38580
        rewardDetails.totalAllocPoints = 100;
        rewardDetails.start = start;
        rewardDetails.end = end;
        rewardDetails.exists = true;

        pool.allocPoints = 35; // There's some other pools.

        assertEq(pool.indexAndUpdate(rewardDetails, alice, 0, 0), 0); // alice stakes 15*10**7 1e18
        skip(10);
        uint256 acc = (rewardDetails.rewardPerSec * 10 * 1e24 * 35) / 15e25 / 100;
        assertEq(acc, 900);
        assertEq(pool.indexAndUpdate(rewardDetails, bob, 0, 15e25), 0); // bob stakes 75* 10**7 1e18
        skip(1000); // @note 1010
        acc += (rewardDetails.rewardPerSec * 1000 * 1e24 * 35) / 90e25 / 100;
        assertEq(acc, 900 + 15003);

        uint256 actual = pool.indexAndUpdate(rewardDetails, alice, 15e25, 90e25);
        uint256 expectedHarvest = (acc * 15e25) / 1e24; // 2385450
        // Note non rounded emissions over this period to alice: 2250500 + 135030 = 2385530, rounding error is all right
        assertEq(actual, expectedHarvest);
        assertEq(pool.indexAndUpdate(rewardDetails, bob, 75e25, 90e25), 11252250); // expected: 11252500
    }

    /// @dev We distribute an 1e18 stable to 225M 1e18 stakes at 0.5% APR (realistic extrema case for low reward/stake ratio)
    /// @dev Conclusion: highly accurate
    function test_updatePrecision18decReward18DecStake() public {
        uint256 rewards = 100_000 * 1e18; // 385 rewards per second
        uint48 start = uint48(block.timestamp);
        uint48 duration = 24 * 3600 * 30;
        uint48 end = start + duration;
        rewardDetails.rewardPerSec = rewards / duration; // 38580246913580246
        rewardDetails.totalAllocPoints = 100;
        rewardDetails.start = start;
        rewardDetails.end = end;
        rewardDetails.exists = true;

        pool.allocPoints = 35; // There's some other pools.

        assertEq(pool.indexAndUpdate(rewardDetails, alice, 0, 0), 0); // alice stakes 15*10**7 1e18
        skip(10);
        uint256 acc = (rewardDetails.rewardPerSec * 10 * 1e24 * 35) / 15e25 / 100;
        assertEq(acc, 900205761316872);
        assertEq(pool.indexAndUpdate(rewardDetails, bob, 0, 15e25), 0); // bob stakes 75* 10**7 1e18
        skip(1000); // @note 1010
        acc += (rewardDetails.rewardPerSec * 1000 * 1e24 * 35) / 90e25 / 100;
        assertEq(acc, 900205761316872 + 15003429355281206);

        uint256 actual = pool.indexAndUpdate(rewardDetails, alice, 15e25, 90e25); // 2385545267489711700
        uint256 expectedHarvest = (acc * 15e25) / 1e24; // 2385545267489711877
        assertEq(actual, expectedHarvest);
        assertEq(pool.indexAndUpdate(rewardDetails, bob, 75e25, 90e25), 11252572016460904500); // actual: 11252572016460904500 expected: 11252572016460905083
    }

    /// @dev We distribute an 1e18 stable to 225M 1e6 stakes at 0.5% APR (realistic extrema case for low reward/stake ratio)
    /// @dev Conclusion: Perfectly accurate.
    function test_updatePrecision18decReward6DecStake() public {
        uint256 rewards = 100_000 * 1e18; // 385 rewards per second
        uint48 start = uint48(block.timestamp);
        uint48 duration = 24 * 3600 * 30;
        uint48 end = start + duration;
        rewardDetails.rewardPerSec = rewards / duration; // 38580246913580246
        rewardDetails.totalAllocPoints = 100;
        rewardDetails.start = start;
        rewardDetails.end = end;
        rewardDetails.exists = true;

        pool.allocPoints = 35; // There's some other pools.

        assertEq(pool.indexAndUpdate(rewardDetails, alice, 0, 0), 0); // alice stakes 15*10**7 1e18
        skip(10);
        uint256 acc = (rewardDetails.rewardPerSec * 10 * 1e24 * 35) / 15e6 / 100;
        assertEq(acc, 9002057613168724066666666666666666);
        assertEq(pool.indexAndUpdate(rewardDetails, bob, 0, 15e6), 0); // bob stakes 75* 10**7 1e18
        skip(1000); // @note 1010
        acc += (rewardDetails.rewardPerSec * 1000 * 1e24 * 35) / 90e6 / 100;
        assertEq(acc, 9002057613168724066666666666666666 + 150034293552812067777777777777777777);

        uint256 actual = pool.indexAndUpdate(rewardDetails, alice, 15e6, 90e6); // 2385545267489711877
        uint256 expectedHarvest = (acc * 15e6) / 1e24; // 2385545267489711877
        assertEq(actual, expectedHarvest);
        assertEq(pool.indexAndUpdate(rewardDetails, bob, 75e6, 90e6), 11252572016460905083); // actual: 11252572016460905083 expected: 11252572016460905083
    }

    function test_successive_deposits() public {
        rewardDetails.rewardPerSec = 100;
        rewardDetails.totalAllocPoints = 100;
        rewardDetails.start = uint48(block.timestamp);
        rewardDetails.end = rewardDetails.start; // start = end (mimic many calls at once)
        rewardDetails.exists = true;

        pool.allocPoints = 35; // There's some other pools.

        // make several calls to indexAndUpdate(...)
        for (uint256 i = 0; i < 10; i++) {
            assertEq(pool.indexAndUpdate(rewardDetails, alice, 1e12 * i, 1e12 * i), 0); // ensure rewardsForUser = 0
            assertEq(pool.rewardDebt[alice], 0); // ensure rewardDebt does not increase with each successive call
        }
    }

}

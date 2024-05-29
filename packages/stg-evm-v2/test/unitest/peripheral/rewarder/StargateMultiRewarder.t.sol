// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { StargateBaseTest, console } from "../../stargate/StargateBase.t.sol";
import { TestToken } from "../../../utils/TestToken.sol";
import { RewarderMock } from "../../../mocks/RewarderMock.sol";
import { DepositorMock } from "../../../mocks/DepositorMock.sol";
import { TestToken } from "../../../utils/TestToken.sol";

import { IRewarder } from "../../../../src/peripheral/rewarder/interfaces/IRewarder.sol";
import { StargateMultiRewarder, IERC20, IStargateStaking, IMultiRewarder } from "../../../../src/peripheral/rewarder/StargateMultiRewarder.sol";

contract StargateMultiRewarderTest is StargateBaseTest {
    address staking = makeAddr("staking");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    StargateMultiRewarder rewarder;
    TestToken token1;
    TestToken token2;

    function setUp() public override {
        super.setUp();

        // @note these are isolated tests meaning we need to sometimes mock responses on the staking address.
        rewarder = new StargateMultiRewarder(IStargateStaking(staking));
        token1 = new TestToken("Test1", "TST1", 0);
        token2 = new TestToken("Test2", "TST2", 0);
    }

    function _now() internal view returns (uint48) {
        return uint48(block.timestamp);
    }

    function _setRewards(TestToken rewardToken, uint256 amount, uint48 start, uint48 duration) internal {
        rewardToken.mint(address(this), amount);
        rewardToken.approve(address(rewarder), amount);
        uint48 oldEnd = rewarder.rewardDetails(address(rewardToken)).end;
        uint48 oldStart = rewarder.rewardDetails(address(rewardToken)).start;
        uint256 amountToAdd = amount;
        if (oldEnd > _now()) {
            uint48 maxStart = _now() > oldStart ? _now() : oldStart;
            amountToAdd += (oldEnd - maxStart) * rewarder.rewardDetails(address(rewardToken)).rewardPerSec;
        }

        vm.expectEmit(address(rewarder));
        emit IMultiRewarder.RewardSet(address(rewardToken), amount, amountToAdd, start, duration);
        rewarder.setReward(address(rewardToken), amount, start, duration);
    }

    function test_setAndExtendRewards() public {
        // Creates a reward pool
        assertEq(rewarder.rewardTokens().length, 0);
        uint256 balRewarderBefore = token1.balanceOf(address(rewarder));

        _setRewards(token1, 101, _now(), 10);
        assertEq(token1.balanceOf(address(rewarder)), balRewarderBefore + 101);
        assertEq(rewarder.rewardTokens().length, 1);
        assertEq(rewarder.rewardTokens()[0], address(token1));

        assertEq(rewarder.rewardDetails(address(token1)).rewardPerSec, 10);
        assertEq(rewarder.rewardDetails(address(token1)).totalAllocPoints, 0);
        assertEq(rewarder.rewardDetails(address(token1)).start, _now());
        assertEq(rewarder.rewardDetails(address(token1)).end, _now() + 10);
        assertEq(rewarder.rewardDetails(address(token1)).exists, true);

        _setRewards(token2, 50, _now() + 100, 17);
        assertEq(rewarder.rewardTokens().length, 2);
        assertEq(rewarder.rewardTokens()[0], address(token1));
        assertEq(rewarder.rewardTokens()[1], address(token2));

        assertEq(rewarder.rewardDetails(address(token2)).rewardPerSec, 2);
        assertEq(rewarder.rewardDetails(address(token2)).totalAllocPoints, 0);
        assertEq(rewarder.rewardDetails(address(token2)).start, _now() + 100);
        assertEq(rewarder.rewardDetails(address(token2)).end, _now() + 100 + 17);
        assertEq(rewarder.rewardDetails(address(token2)).exists, true);

        assertEq(rewarder.rewardDetails(address(token1)).rewardPerSec, 10);
        assertEq(rewarder.rewardDetails(address(token1)).totalAllocPoints, 0);
        assertEq(rewarder.rewardDetails(address(token1)).start, _now());
        assertEq(rewarder.rewardDetails(address(token1)).end, _now() + 10);
        assertEq(rewarder.rewardDetails(address(token1)).exists, true);

        assertEq(token2.balanceOf(address(rewarder)), 50);

        // wait 30 seconds
        skip(2);

        _setRewards(token1, 100, _now() + 20, 10);
        assertEq(rewarder.rewardTokens().length, 2);
        assertEq(rewarder.rewardTokens()[0], address(token1));
        assertEq(rewarder.rewardTokens()[1], address(token2));

        assertEq(rewarder.rewardDetails(address(token1)).rewardPerSec, 18);
        assertEq(rewarder.rewardDetails(address(token1)).totalAllocPoints, 0);
        assertEq(rewarder.rewardDetails(address(token1)).start, _now() + 20);
        assertEq(rewarder.rewardDetails(address(token1)).end, _now() + 30);
        assertEq(rewarder.rewardDetails(address(token1)).exists, true);

        assertEq(token1.balanceOf(address(rewarder)), 201);

        // test extend reward
        token1.mint(address(this), 53);
        token1.approve(address(rewarder), 53);
        vm.expectEmit(address(rewarder));
        emit IMultiRewarder.RewardExtended(address(token1), 53, _now() + 32);
        rewarder.extendReward(address(token1), 53);
        assertEq(token1.balanceOf(address(rewarder)), 254);
        assertEq(rewarder.rewardDetails(address(token1)).rewardPerSec, 18);
        assertEq(rewarder.rewardDetails(address(token1)).totalAllocPoints, 0);
        assertEq(rewarder.rewardDetails(address(token1)).start, _now() + 20);
        assertEq(rewarder.rewardDetails(address(token1)).end, _now() + 32);
        assertEq(rewarder.rewardDetails(address(token1)).exists, true);

        skip(2);
        token1.mint(address(this), 53);
        token1.approve(address(rewarder), 53);
        vm.expectEmit(address(rewarder));
        emit IMultiRewarder.RewardExtended(address(token1), 53, _now() + 32);
        rewarder.extendReward(address(token1), 53);
        assertEq(token1.balanceOf(address(rewarder)), 307);
        assertEq(rewarder.rewardDetails(address(token1)).rewardPerSec, 18);
        assertEq(rewarder.rewardDetails(address(token1)).totalAllocPoints, 0);
        assertEq(rewarder.rewardDetails(address(token1)).start, _now() + 18);
        assertEq(rewarder.rewardDetails(address(token1)).end, _now() + 32);
        assertEq(rewarder.rewardDetails(address(token1)).exists, true);

        skip(20);

        token1.mint(address(this), 53);
        token1.approve(address(rewarder), 53);
        vm.expectEmit(address(rewarder));
        emit IMultiRewarder.RewardExtended(address(token1), 53, _now() + 14);
        rewarder.extendReward(address(token1), 53);
        assertEq(token1.balanceOf(address(rewarder)), 360);
        assertEq(rewarder.rewardDetails(address(token1)).rewardPerSec, 18);
        assertEq(rewarder.rewardDetails(address(token1)).totalAllocPoints, 0);
        assertEq(rewarder.rewardDetails(address(token1)).start, _now() - 2);
        assertEq(rewarder.rewardDetails(address(token1)).end, _now() + 14);
        assertEq(rewarder.rewardDetails(address(token1)).exists, true);

        skip(14);

        token1.mint(address(this), 53);
        token1.approve(address(rewarder), 53);
        vm.expectEmit(address(rewarder));
        emit IMultiRewarder.RewardExtended(address(token1), 53, _now() + 2);
        rewarder.extendReward(address(token1), 53);
        assertEq(token1.balanceOf(address(rewarder)), 413);
        assertEq(rewarder.rewardDetails(address(token1)).rewardPerSec, 18);
        assertEq(rewarder.rewardDetails(address(token1)).totalAllocPoints, 0);
        assertEq(rewarder.rewardDetails(address(token1)).start, _now() - 16);
        assertEq(rewarder.rewardDetails(address(token1)).end, _now() + 2);
        assertEq(rewarder.rewardDetails(address(token1)).exists, true);

        skip(3);
        token1.mint(address(this), 53);
        token1.approve(address(rewarder), 53);
        vm.expectRevert(abi.encodeWithSelector(IMultiRewarder.MultiRewarderPoolFinished.selector, address(token1)));
        rewarder.extendReward(address(token1), 53);
    }

    function test_revert_setAllocPointsNonExistentReward() public {
        IERC20 stakingToken = new TestToken("Staking", "STK", 100);
        IERC20[] memory stakingTokens = new IERC20[](1);
        stakingTokens[0] = stakingToken;
        uint48[] memory allocs = new uint48[](1);

        vm.prank(staking);
        rewarder.connect(stakingToken);

        address nonExistentRewardToken = vm.addr(1);
        rewarder.setAllocPoints(nonExistentRewardToken, stakingTokens, allocs);
        vm.expectEmit();
        emit IMultiRewarder.RewardStopped(nonExistentRewardToken, msg.sender, false);
        rewarder.stopReward(nonExistentRewardToken, msg.sender, false);

        // sanity check no alloc points are set
        (IERC20[] memory tokens, uint48[] memory allocations) = rewarder.allocPointsByReward(nonExistentRewardToken);
        assertEq(tokens.length, 0);
        assertEq(allocations.length, 0);
    }

    function test_revert_extendRewardNonExistentReward() public {
        token1.mint(address(this), 100);
        token1.approve(address(rewarder), 100);
        vm.expectRevert(
            abi.encodeWithSelector(IMultiRewarder.MultiRewarderUnregisteredToken.selector, address(token1))
        );
        rewarder.extendReward(address(token1), 100);
    }

    function test_revert_setRewardsRequiresTokenApproval() public {
        token1.mint(address(this), 100);
        vm.expectRevert();
        rewarder.setReward(address(token1), 100, _now(), 10);
    }

    function testFuzz_revert_setRewardsRequiresTokenApproval(uint256 amount) public {
        token1.mint(address(this), amount);
        if (amount > 0) {
            vm.expectRevert();
        } else {
            vm.expectRevert(IMultiRewarder.MultiRewarderZeroRewardRate.selector);
        }
        rewarder.setReward(address(token1), amount, _now(), 10);
    }

    function test_revert_setRewardsRequiresTokens() public {
        token1.mint(address(this), 100);
        token1.approve(address(rewarder), 101);
        vm.expectRevert();
        rewarder.setReward(address(token1), 101, _now(), 10);
    }

    function test_revert_setRewardsInPast() public {
        token1.mint(address(this), 100);
        token1.approve(address(rewarder), 101);
        vm.expectRevert(abi.encodeWithSelector(IMultiRewarder.MultiRewarderStartInPast.selector, _now() - 1));
        rewarder.setReward(address(token1), 10, _now() - 1, 10);
    }

    function testFuzz_revert_setRewardsStartInPast(uint48 start) public {
        token1.mint(address(this), 100);
        token1.approve(address(rewarder), 101);
        if (start < _now()) {
            vm.expectRevert(abi.encodeWithSelector(IMultiRewarder.MultiRewarderStartInPast.selector, start));
        }
        if (start > type(uint48).max - 10) {
            // @note due to end time calc.
            vm.expectRevert();
        }
        rewarder.setReward(address(token1), 10, start, 10);
    }

    function testFuzz_revert_setRewardsRequiresTokens(uint256 minted, uint256 approved, uint256 actual) public {
        token1.mint(address(this), minted);
        token1.approve(address(rewarder), approved);
        if (actual / 10 == 0) {
            vm.expectRevert(IMultiRewarder.MultiRewarderZeroRewardRate.selector);
        } else if (minted < actual || approved < actual) {
            vm.expectRevert();
        }

        rewarder.setReward(address(token1), actual, _now(), 10);
    }

    function test_revert_nonOwner() public {
        rewarder.transferOwnership(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        rewarder.setReward(address(token1), 100, 0, 0);
        vm.expectRevert("Ownable: caller is not the owner");
        rewarder.extendReward(address(token1), 0);
        IERC20[] memory stakingTokens = new IERC20[](0);
        uint48[] memory allocs = new uint48[](0);
        vm.expectRevert("Ownable: caller is not the owner");
        rewarder.setAllocPoints(address(token1), stakingTokens, allocs);
        vm.expectRevert("Ownable: caller is not the owner");
        rewarder.transferOwnership(bob);
        vm.expectRevert("Ownable: caller is not the owner");
        rewarder.renounceOwnership();
    }

    function test_revert_notConnected() public {
        IERC20 stakingToken = new TestToken("Staking", "STK", 100);
        IERC20[] memory stakingTokens = new IERC20[](1);
        stakingTokens[0] = stakingToken;

        vm.expectRevert(
            abi.encodeWithSelector(IMultiRewarder.MultiRewarderDisconnectedStakingToken.selector, address(stakingToken))
        );
        rewarder.setAllocPoints(address(token1), stakingTokens, new uint48[](1));

        vm.prank(staking);
        rewarder.connect(stakingToken);

        vm.expectEmit();
        emit IMultiRewarder.AllocPointsSet(address(token1), stakingTokens, new uint48[](1));
        rewarder.setAllocPoints(address(token1), stakingTokens, new uint48[](1));
    }

    function test_revert_nonStaking() public {
        vm.expectRevert(abi.encodeWithSelector(IRewarder.MultiRewarderUnauthorizedCaller.selector, address(this)));
        rewarder.connect(token1);
        vm.expectRevert(abi.encodeWithSelector(IRewarder.MultiRewarderUnauthorizedCaller.selector, address(this)));
        rewarder.onUpdate(token1, address(this), 0, 0, 0);
    }

    function test_revert_alreadyConnected() public {
        vm.startPrank(staking);
        vm.expectEmit();
        emit IRewarder.RewarderConnected(token1);
        rewarder.connect(token1);
        vm.expectRevert(abi.encodeWithSelector(IRewarder.RewarderAlreadyConnected.selector, token1));
        rewarder.connect(token1);
        vm.stopPrank();
    }

    function test_stakingView() public {
        assertEq(address(rewarder.staking()), staking);
    }

    function test_getRewardsOnNonExistentPoolReturnsEmptyArraysAndDoesNotDoCalls() public {
        (address[] memory tokens, uint256[] memory amounts) = rewarder.getRewards(token1, alice);
        assertEq(tokens.length, 0);
        assertEq(amounts.length, 0);
    }
}

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { StargateBaseTest, console } from "../../stargate/StargateBase.t.sol";
import { TestToken } from "../../../utils/TestToken.sol";
import { DepositorMock } from "../../../mocks/DepositorMock.sol";
import { StakingReceiverMock } from "../../../mocks/StakingReceiverMock.sol";
import { TestToken } from "../../../utils/TestToken.sol";

import { StargateMultiRewarder, IERC20, IMultiRewarder } from "../../../../src/peripheral/rewarder/StargateMultiRewarder.sol";
import { StargateStaking, IRewarder, IStargateStaking, IStakingReceiver } from "../../../../src/peripheral/rewarder/StargateStaking.sol";

contract StargateMultiRewarderIntegrationTest is StargateBaseTest {
    address private constant ETH = address(0);
    StargateStaking staking;
    StargateMultiRewarder rewarder;

    TestToken private token1;
    TestToken private token2;
    TestToken private token3;
    TestToken private token4;
    address alice = address(vm.addr(101));
    address bob = address(vm.addr(102));
    address stakingAdmin = address(vm.addr(103));
    address rewardAdmin = address(vm.addr(104));
    address claude = address(vm.addr(105));

    function setUp() public override {
        super.setUp();

        staking = new StargateStaking();
        rewarder = new StargateMultiRewarder(staking);
        token1 = new TestToken("Test1", "TST1", 0);
        token2 = new TestToken("Test2", "TST2", 0);
        token3 = new TestToken("Test3", "TST3", 0);
        token4 = new TestToken("Test4", "TST4", 0);

        vm.startPrank(address(this));
        staking.transferOwnership(stakingAdmin);
        rewarder.transferOwnership(rewardAdmin);
    }

    function _setAllocPoint(address rewardToken, IERC20 stakingToken, uint48 allocPoint) internal {
        (, address msgSender, ) = vm.readCallers();
        if (msgSender != rewardAdmin) vm.startPrank(rewardAdmin);

        IERC20[] memory stakingTokens = new IERC20[](1);
        stakingTokens[0] = stakingToken;
        uint48[] memory allocPoints = new uint48[](1);
        allocPoints[0] = allocPoint;
        rewarder.setAllocPoints(rewardToken, stakingTokens, allocPoints);

        if (msgSender != rewardAdmin) {
            vm.stopPrank();
            vm.startPrank(msgSender);
        }
    }

    function _addToken(TestToken token) internal {
        (, address msgSender, ) = vm.readCallers();
        if (msgSender != stakingAdmin) vm.startPrank(stakingAdmin);
        staking.setPool(token, rewarder);
        if (msgSender != stakingAdmin) {
            vm.stopPrank();
            vm.startPrank(msgSender);
        }
    }

    function _validateBalances(
        TestToken token,
        uint256 aliceInitial,
        uint256 aliceDeposited,
        uint256 bobInitial,
        uint256 bobDeposited
    ) internal {
        uint256 totalDeposit = aliceDeposited + bobDeposited;
        assertGe(token.balanceOf(address(staking)), totalDeposit);
        assertEq(staking.totalSupply(token), totalDeposit);
        assertEq(staking.balanceOf(token, alice), aliceDeposited);
        assertEq(staking.balanceOf(token, bob), bobDeposited);
        assertEq(token.balanceOf(alice), aliceInitial - aliceDeposited);
        assertEq(token.balanceOf(bob), bobInitial - bobDeposited);
    }

    function _validateRewardDetails(
        TestToken token,
        uint160 expectedTotalAllocPoints,
        uint256 expectedRewardPerSec,
        uint48 expectedStart,
        uint48 expectedEnd,
        bool expectedExists,
        uint256 expectedBalance
    ) internal {
        if (address(token) == ETH) {
            assertEq(address(rewarder).balance, expectedBalance);
        } else {
            assertEq(token.balanceOf(address(rewarder)), expectedBalance);
        }
        assertEq(rewarder.rewardDetails(address(token)).totalAllocPoints, expectedTotalAllocPoints);
        assertEq(rewarder.rewardDetails(address(token)).rewardPerSec, expectedRewardPerSec);
        assertEq(rewarder.rewardDetails(address(token)).start, expectedStart);
        assertEq(rewarder.rewardDetails(address(token)).end, expectedEnd);
        assertEq(rewarder.rewardDetails(address(token)).exists, expectedExists);
    }

    function _claimPool(TestToken stake) internal {
        IERC20[] memory stakes = new IERC20[](1);
        stakes[0] = stake;
        staking.claim(stakes);
    }

    function _validateAllocPoint(TestToken reward, TestToken stake, uint48 expectedAllocPoint) internal {
        (IERC20[] memory stakes, uint48[] memory allocPoints) = rewarder.allocPointsByReward(address(reward));
        bool found;
        for (uint256 i = 0; i < stakes.length; i++) {
            if (address(stakes[i]) == address(stake)) {
                assertEq(allocPoints[i], expectedAllocPoint);
                found = true;
            }
        }

        assertTrue(found);
        found = false;
        (address[] memory rewards, uint48[] memory allocPoints2) = rewarder.allocPointsByStake(stake);
        for (uint256 i = 0; i < rewards.length; i++) {
            if (rewards[i] == address(reward)) {
                assertEq(allocPoints2[i], expectedAllocPoint);
                found = true;
            }
        }
    }

    function _validatePendingReward(TestToken stake, TestToken reward, address user, uint256 pendingReward) internal {
        (address[] memory rewardTokens, uint256[] memory rewards) = rewarder.getRewards(stake, user);
        bool found;
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            if (rewardTokens[i] == address(reward)) {
                assertEq(rewards[i], pendingReward);
                found = true;
            }
        }
        assertTrue(found);
    }

    function _now() internal view returns (uint48) {
        return uint48(block.timestamp);
    }

    function test_integrationLarge() public {
        vm.startPrank(bob);
        token1.approve(address(staking), 1000e18);
        token3.approve(address(staking), 1000e18);
        token1.mint(bob, 10001e18);
        token3.mint(bob, 10001e18);
        vm.startPrank(alice);
        token1.approve(address(staking), 1000e18);
        token3.approve(address(staking), 1000e18);
        token1.mint(alice, 10001e18);
        token3.mint(alice, 10001e18);

        DepositorMock depositor = new DepositorMock();
        token1.mint(address(depositor), 1000e18);
        token3.mint(address(depositor), 1000e18);

        assertEq(staking.tokens().length, 0);
        assertEq(staking.tokensLength(), 0);
        assertEq(staking.tokens(0, 0).length, 0);

        _addToken(token1);

        uint256 bobInit = token1.balanceOf(bob);
        uint256 aliceInit = token1.balanceOf(alice);
        uint256 bobInit3 = token3.balanceOf(bob);
        uint256 aliceInit3 = token3.balanceOf(alice);

        vm.expectEmit();
        emit IStargateStaking.Deposit(token1, alice, alice, 1e18);
        staking.deposit(token1, 1e18);
        _validateBalances(token1, aliceInit, 1e18, bobInit, 0);

        vm.expectEmit();
        emit IStargateStaking.Deposit(token1, alice, alice, 1e17);
        staking.deposit(token1, 1e17);
        _validateBalances(token1, aliceInit, 11e17, bobInit, 0);

        vm.expectEmit();
        emit IStargateStaking.Withdraw(token1, alice, alice, 2e17, true);
        staking.withdraw(token1, 2e17);
        _validateBalances(token1, aliceInit, 9e17, bobInit, 0);

        skip(10);
        console.log("1.0");
        _validateRewardDetails(token2, 0, 0, 0, 0, false, 0);
        _setRewards(token2, 10000, _now() + 10, 1000);

        _validateRewardDetails(token2, 0, 10, _now() + 10, _now() + 1010, true, 10000);

        console.log("1.1");
        _setAllocPoint(address(token2), token1, 10);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(token2, 10, 10, _now() + 10, _now() + 1010, true, 10000);
        _validateAllocPoint(token2, token1, 10);

        skip(1);

        console.log("2.0");
        _validateRewardDetails(token2, 10, 10, _now() + 9, _now() + 1009, true, 10000);
        _validatePendingReward(token1, token2, alice, 0);
        _setRewards(token2, 1e18 - 10000, _now() + 9, 1000);
        _validateRewardDetails(token2, 10, 1e18 / 1000, _now() + 9, _now() + 1009, true, 1e18);

        skip(8);

        console.log("3.0");
        _validateRewardDetails(token2, 10, 1e18 / 1000, _now() + 1, _now() + 1001, true, 1e18);
        _validatePendingReward(token1, token2, alice, 0);

        _extendRewards(token2, 2e18 / 10000 + 1);
        _validateRewardDetails(token2, 10, 1e18 / 1000, _now() + 1, _now() + 1001, true, 10002e18 / 10000 + 1);
        _validatePendingReward(token1, token2, alice, 0);

        console.log("3.1");
        _claimPool(token1);
        _validateRewardDetails(token2, 10, 1e18 / 1000, _now() + 1, _now() + 1001, true, 10002e18 / 10000 + 1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 9e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 0);

        console.log("3.2");
        _claimPool(token1);
        _validateRewardDetails(token2, 10, 1e18 / 1000, _now() + 1, _now() + 1001, true, 10002e18 / 10000 + 1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 9e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 0);

        skip(1);
        console.log("4.0");
        _validatePendingReward(token1, token2, alice, 0);
        _claimPool(token1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(token2, 10, 1e18 / 1000, _now(), _now() + 1000, true, 10002e18 / 10000 + 1);
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 9e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 0);
        console.log("4.1");
        _claimPool(token1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(token2, 10, 1e18 / 1000, _now(), _now() + 1000, true, 10002e18 / 10000 + 1);
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 9e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 0);

        skip(1);

        console.log("5.0");
        _validateRewardDetails(token2, 10, 1e18 / 1000, _now() - 1, _now() + 999, true, 10002e18 / 10000 + 1);
        _validatePendingReward(token1, token2, alice, 1e18 / 1000 - 1);
        _claimPool(token1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 1,
            _now() + 999,
            true,
            10002e18 / 10000 + 2 - 1e18 / 1000
        );
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 9e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 1e18 / 1000 - 1);

        console.log("5.1");
        _claimPool(token1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 1,
            _now() + 999,
            true,
            10002e18 / 10000 + 2 - 1e18 / 1000
        );
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 9e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 1e18 / 1000 - 1);

        skip(5);
        console.log("6.0");
        _validatePendingReward(token1, token2, alice, 5e18 / 1000 - 1);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 6,
            _now() + 994,
            true,
            10002e18 / 10000 + 2 - 1e18 / 1000
        );
        staking.withdraw(token1, 1e17);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 6,
            _now() + 994,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 8e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 6e18 / 1000 - 2);

        console.log("6.1");
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 6,
            _now() + 994,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        staking.withdraw(token1, 1e17);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 6,
            _now() + 994,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 7e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 6e18 / 1000 - 2);

        console.log("6.2");
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 6,
            _now() + 994,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        staking.deposit(token1, 1e17);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 6,
            _now() + 994,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        _validateAllocPoint(token2, token1, 10);
        _validateBalances(token1, aliceInit, 8e17, bobInit, 0);
        assertEq(token2.balanceOf(alice), 6e18 / 1000 - 2);

        skip(1);
        console.log("7.0");
        _validatePendingReward(token1, token2, alice, 1e18 / 1000);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 7,
            _now() + 993,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        staking.emergencyWithdraw(token1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateBalances(token1, aliceInit, 0, bobInit, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 7,
            _now() + 993,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        assertEq(token2.balanceOf(alice), 6e18 / 1000 - 2);
        console.log("7.1");
        staking.withdraw(token1, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validateBalances(token1, aliceInit, 0, bobInit, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 7,
            _now() + 993,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        assertEq(token2.balanceOf(alice), 6e18 / 1000 - 2);

        skip(1);
        console.log("8.0");
        staking.deposit(token1, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validateBalances(token1, aliceInit, 0, bobInit, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 8,
            _now() + 992,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        assertEq(token2.balanceOf(alice), 6e18 / 1000 - 2);

        console.log("8.1");
        staking.deposit(token1, 1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateBalances(token1, aliceInit, 1, bobInit, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 8,
            _now() + 992,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        assertEq(token2.balanceOf(alice), 6e18 / 1000 - 2);
        console.log("8.2");
        staking.deposit(token1, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validateBalances(token1, aliceInit, 1, bobInit, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 8,
            _now() + 992,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        assertEq(token2.balanceOf(alice), 6e18 / 1000 - 2);

        skip(1);
        console.log("9.0");
        _validatePendingReward(token1, token2, alice, 1e18 / 1000);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 9,
            _now() + 991,
            true,
            10002e18 / 10000 + 3 - 6e18 / 1000
        );
        _validateBalances(token1, aliceInit, 1, bobInit, 0);
        staking.withdraw(token1, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 9,
            _now() + 991,
            true,
            10002e18 / 10000 + 3 - 7e18 / 1000
        );
        assertEq(token2.balanceOf(alice), 7e18 / 1000 - 2);

        skip(1000);
        console.log("10.0");
        _validatePendingReward(token1, token2, alice, 991e18 / 1000);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 1009,
            _now() - 9,
            true,
            10002e18 / 10000 + 3 - 7e18 / 1000
        );
        staking.withdraw(token1, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 1009,
            _now() - 9,
            true,
            10002e18 / 10000 + 3 - 998e18 / 1000
        );
        assertEq(token2.balanceOf(alice), 998e18 / 1000 - 2);

        skip(1000);
        console.log("11.0");
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 2009,
            _now() - 1009,
            true,
            10002e18 / 10000 + 3 - 998e18 / 1000
        );
        staking.withdraw(token1, 0);
        staking.deposit(token1, 0);
        _claimPool(token1);
        _validatePendingReward(token1, token2, alice, 0);
        assertEq(token2.balanceOf(alice), 998e18 / 1000 - 2);

        staking.emergencyWithdraw(token1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateBalances(token1, aliceInit, 0, bobInit, 0);
        skip(1000);
        console.log("12.0");
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 3009,
            _now() - 2009,
            true,
            10002e18 / 10000 + 3 - 998e18 / 1000
        );
        _validateBalances(token1, aliceInit, 0, bobInit, 0);
        staking.deposit(token1, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 3009,
            _now() - 2009,
            true,
            10002e18 / 10000 + 3 - 998e18 / 1000
        );
        staking.deposit(token1, 1);
        _validatePendingReward(token1, token2, alice, 0);
        skip(1000);
        console.log("13.0");
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 1000,
            _now() - 4009,
            _now() - 3009,
            true,
            10002e18 / 10000 + 3 - 998e18 / 1000
        );
        _setRewards(token2, 1e18, _now(), 100);
        _validatePendingReward(token1, token2, alice, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now(),
            _now() + 100,
            true,
            20002e18 / 10000 + 3 - 998e18 / 1000
        );
        console.log("13.1");
        staking.deposit(token1, 1);
        _validatePendingReward(token1, token2, alice, 0);
        _validateBalances(token1, aliceInit, 2, bobInit, 0);
        assertEq(token2.balanceOf(alice), 998e18 / 1000 - 2);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now(),
            _now() + 100,
            true,
            20002e18 / 10000 + 3 - 998e18 / 1000
        );

        skip(50);
        console.log("14.0");
        vm.startPrank(bob);
        _validatePendingReward(token1, token2, bob, 0);
        staking.deposit(token1, 4); // 2/3th after half of rewards have been emitted, no harvest.
        _validatePendingReward(token1, token2, alice, 50e16);
        _validatePendingReward(token1, token2, bob, 0);
        _validateBalances(token1, aliceInit, 2, bobInit, 4);
        assertEq(token2.balanceOf(alice), 998e18 / 1000 - 2);
        skip(30); // 50 seconds to alice, 30 seconds 1/3th alice 2/3th bob. => 0.2E bob, 0.1E alice
        console.log("15.0");
        _validatePendingReward(token1, token2, alice, 60e16);
        _validatePendingReward(token1, token2, bob, 20e16);
        assertEq(token2.balanceOf(bob), 0);
        _claimPool(token1);
        _validatePendingReward(token1, token2, alice, 60e16);
        _validatePendingReward(token1, token2, bob, 0);
        assertEq(token2.balanceOf(bob), 200e18 / 1000);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now() - 80,
            _now() + 20,
            true,
            20002e18 / 10000 + 3 - 1198e18 / 1000
        );
        skip(15); // 50 seconds to alice, 45 seconds 1/3th alice, 15 sec 2/3th bob. // 0.5E + 0.15E alice, 0.1E bob.
        console.log("16.0");
        _validatePendingReward(token1, token2, alice, 65e16);
        _validatePendingReward(token1, token2, bob, 10e16);
        _claimPool(token1);
        _validatePendingReward(token1, token2, alice, 65e16);
        _validatePendingReward(token1, token2, bob, 0);
        assertEq(token2.balanceOf(bob), 300e18 / 1000);
        assertEq(token2.balanceOf(alice), 998e18 / 1000 - 2);
        vm.startPrank(alice);
        assertEq(token2.balanceOf(alice), 998e18 / 1000 - 2);
        console.log("16.1");
        _validatePendingReward(token1, token2, alice, 65e16);
        _validatePendingReward(token1, token2, bob, 0);
        staking.deposit(token1, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, 0);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        _validateBalances(token1, aliceInit, 2, bobInit, 4);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now() - 95,
            _now() + 5,
            true,
            20002e18 / 10000 + 3 - 1948e18 / 1000
        );

        skip(15);
        console.log("17.0");
        _validatePendingReward(token1, token2, alice, uint256(5e16) / 3);
        _validatePendingReward(token1, token2, bob, (uint256(5e16) * 2) / 3);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now() - 110,
            _now() - 10,
            true,
            20002e18 / 10000 + 3 - 1948e18 / 1000
        );
        _validateBalances(token1, aliceInit, 2, bobInit, 4);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        assertEq(token2.balanceOf(bob), 300e18 / 1000);
        staking.emergencyWithdraw(token1); // We forfeit all alice's rewards, next harvest will occur as if her shares were not there.
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, 5e16);
        _validateBalances(token1, aliceInit, 0, bobInit, 4);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now() - 110,
            _now() - 10,
            true,
            20002e18 / 10000 + 3 - 1948e18 / 1000
        );

        vm.startPrank(bob);
        console.log("17.1");
        assertEq(token2.balanceOf(bob), 300e18 / 1000);
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, 5e16);
        staking.deposit(token1, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, 0);
        assertEq(token2.balanceOf(bob), 350e18 / 1000);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now() - 110,
            _now() - 10,
            true,
            20002e18 / 10000 + 3 - 1998e18 / 1000
        );

        skip(1000);
        console.log("18.0");
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, 0);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now() - 1110,
            _now() - 1010,
            true,
            20002e18 / 10000 + 3 - 1998e18 / 1000
        );
        staking.withdraw(token1, 4);
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, 0);
        _validateBalances(token1, aliceInit, 0, bobInit, 0);
        assertEq(token2.balanceOf(bob), 350e18 / 1000);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        _validateRewardDetails(
            token2,
            10,
            1e18 / 100,
            _now() - 1110,
            _now() - 1010,
            true,
            20002e18 / 10000 + 3 - 1998e18 / 1000
        );

        staking.deposit(token1, 1e18); // bob deposits 1e18
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, 0);
        _validateBalances(token1, aliceInit, 0, bobInit, 1e18);

        assertEq(staking.tokens().length, 1);
        assertEq(address(staking.tokens()[0]), address(token1));
        assertEq(address(staking.tokens(0, 1)[0]), address(token1));

        skip(10);
        console.log("19.0");
        _addToken(token3);
        _validateBalances(token1, aliceInit, 0, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);

        assertEq(staking.tokens().length, 2);
        assertEq(address(staking.tokens()[0]), address(token1));
        assertEq(address(staking.tokens()[1]), address(token3));
        assertEq(address(staking.tokens(0, 1)[0]), address(token1));
        assertEq(address(staking.tokens(0, 2)[0]), address(token1));
        assertEq(address(staking.tokens(1, 2)[0]), address(token3));
        assertEq(address(staking.tokens(0, 2)[1]), address(token3));
        assertEq(staking.tokens(0, 0).length, 0);

        skip(10);

        console.log("20.0");
        _validateBalances(token1, aliceInit, 0, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, 0);

        uint48 token4Start = _now();
        uint48 token4End = _now() + 3600 * 24 * 30;
        _setRewards(token4, 100e18, token4Start, token4End - token4Start); // 30 Days, starting now.

        _validateBalances(token1, aliceInit, 0, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);
        uint48 token2Start = _now();
        uint48 token2End = _now() + 3600 * 24 * 7;

        console.log("20.1");
        _setRewards(token2, 10e18, token2Start, token2End - token2Start);

        skip(10);
        console.log("21.0");
        _validateRewardDetails(
            token2,
            10,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 + 20002e18 / 10000 + 3 - 1998e18 / 1000
        );
        _setAllocPoint(address(token2), token3, 30); // 2->1: 25%, 2->3: 75%
        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 + 20002e18 / 10000 + 3 - 1998e18 / 1000
        );
        _validateAllocPoint(token2, token1, 10);
        _validateAllocPoint(token2, token3, 30);
        _validateBalances(token1, aliceInit, 0, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);
        assertEq(token2.balanceOf(bob), 350e18 / 1000);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        assertEq(token4.balanceOf(bob), 0);
        assertEq(token4.balanceOf(alice), 0);

        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, (10 * uint256(10e18)) / (3600 * 24 * 7) - 5); // 5 due to rounding error
        _validatePendingReward(token3, token2, alice, 0);
        _validatePendingReward(token3, token2, bob, 0);

        console.log("21.1");
        depositor.depositTo(staking, token1, alice, 3e18, 3e18); // alice has 75%, bob 25%.
        aliceInit += 3e18;
        _validatePendingReward(token1, token2, alice, 0);
        _validatePendingReward(token1, token2, bob, (10 * uint256(10e18)) / (3600 * 24 * 7) - 5);
        _validatePendingReward(token3, token2, alice, 0);
        _validatePendingReward(token3, token2, bob, 0);
        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 + 20002e18 / 10000 + 3 - 1998e18 / 1000
        );
        _validateBalances(token1, aliceInit, 3e18, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);

        skip(40);

        console.log("22.0");
        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 + 20002e18 / 10000 + 3 - 1998e18 / 1000
        );
        _validateBalances(token1, aliceInit, 3e18, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);
        assertEq(token2.balanceOf(bob), 350e18 / 1000);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        assertEq(token4.balanceOf(bob), 0);
        assertEq(token4.balanceOf(alice), 0);
        _validatePendingReward(token1, token2, alice, (30 * uint256(10e18)) / (3600 * 24 * 7) / 4 - 4);
        _validatePendingReward(token1, token2, bob, (50 * uint256(10e18)) / (3600 * 24 * 7) / 4 - 7);
        _validatePendingReward(token3, token2, alice, 0);
        _validatePendingReward(token3, token2, bob, 0);

        console.log("22.1");

        IERC20[] memory tokens = new IERC20[](2); // bob claims all tokens
        tokens[0] = token3;
        tokens[1] = token1;
        staking.claim(tokens);

        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 + 20002e18 / 10000 + 10 - 1998e18 / 1000 - (50 * uint256(10e18)) / (3600 * 24 * 7) / 4
        );
        _validateBalances(token1, aliceInit, 3e18, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);
        assertEq(token2.balanceOf(bob), 350e18 / 1000 + (50 * uint256(10e18)) / (3600 * 24 * 7) / 4 - 7);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        assertEq(token4.balanceOf(bob), 0);
        assertEq(token4.balanceOf(alice), 0);
        _validatePendingReward(token1, token2, alice, (30 * uint256(10e18)) / (3600 * 24 * 7) / 4 - 4);
        _validatePendingReward(token1, token2, bob, 0);
        _validatePendingReward(token3, token2, alice, 0);
        _validatePendingReward(token3, token2, bob, 0);

        console.log("22.2");
        _setAllocPoint(address(token4), token1, 10);
        _validateRewardDetails(token4, 10, uint256(100e18) / (3600 * 24 * 30), token4Start, token4End, true, 100e18);
        _setAllocPoint(address(token4), token3, 10);
        _validateRewardDetails(token4, 20, uint256(100e18) / (3600 * 24 * 30), token4Start, token4End, true, 100e18);
        _validateAllocPoint(token2, token1, 10);
        _validateAllocPoint(token2, token3, 30);
        _validateAllocPoint(token4, token1, 10);
        _validateAllocPoint(token4, token3, 10);
        _validatePendingReward(token1, token2, alice, (40 * 3 * uint256(10e18)) / (3600 * 24 * 7) / 4 / 4 - 4);
        _validatePendingReward(token1, token2, bob, 0);
        _validatePendingReward(token3, token2, alice, 0);
        _validatePendingReward(token3, token2, bob, 0);
        _validatePendingReward(token1, token4, alice, 0);
        _validatePendingReward(token1, token4, bob, 0);
        _validatePendingReward(token3, token4, alice, 0);
        _validatePendingReward(token3, token4, bob, 0);
        assertEq(token2.balanceOf(bob), 350e18 / 1000 + (50 * uint256(10e18)) / (3600 * 24 * 7) / 4 - 7);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        assertEq(token4.balanceOf(bob), 0);
        assertEq(token4.balanceOf(alice), 0);

        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 + 20002e18 / 10000 + 10 - 1998e18 / 1000 - (50 * uint256(10e18)) / (3600 * 24 * 7) / 4
        );
        _validateBalances(token1, aliceInit, 3e18, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);

        skip(24 * 3600); // We sleep 1 day, note that alice still had a pending reward

        console.log("23.0");
        _validatePendingReward(
            token1,
            token2,
            alice,
            ((40 + 24 * 3600) * 3 * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        ); // rounding is pretty brutal here? 4c
        _validatePendingReward(token1, token2, bob, (21600 * (uint256(10e18) / 3600 / 24 / 7)) / 4);
        _validatePendingReward(token3, token2, alice, 0);
        _validatePendingReward(token3, token2, bob, 0);
        _validatePendingReward(token1, token4, alice, (24 * 3600 * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4);
        _validatePendingReward(token1, token4, bob, (24 * 3600 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4);
        _validatePendingReward(token3, token4, alice, 0);
        _validatePendingReward(token3, token4, bob, 0);
        assertEq(token2.balanceOf(bob), 350e18 / 1000 + (50 * (uint256(10e18) / 3600 / 24 / 7)) / 4);
        assertEq(token2.balanceOf(alice), 1648e18 / 1000 - 2);
        assertEq(token4.balanceOf(bob), 0);
        assertEq(token4.balanceOf(alice), 0);
        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 + 20002e18 / 10000 + 10 - 1998e18 / 1000 - (50 * uint256(10e18)) / (3600 * 24 * 7) / 4
        );
        _validateRewardDetails(token4, 20, uint256(100e18) / (3600 * 24 * 30), token4Start, token4End, true, 100e18);
        _validateBalances(token1, aliceInit, 3e18, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);

        vm.startPrank(alice);

        console.log("23.1");
        staking.deposit(token1, 0);
        _validatePendingReward(token1, token2, alice, 0); // rounding is pretty brutal here? 4c
        _validatePendingReward(token1, token2, bob, (21600 * (uint256(10e18) / 3600 / 24 / 7)) / 4);
        _validatePendingReward(token3, token2, alice, 0);
        _validatePendingReward(token3, token2, bob, 0);
        _validatePendingReward(token1, token4, alice, 0);
        _validatePendingReward(token1, token4, bob, (24 * 3600 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4);
        _validatePendingReward(token3, token4, alice, 0);
        _validatePendingReward(token3, token4, bob, 0);

        assertEq(token2.balanceOf(bob), 350e18 / 1000 + (50 * (uint256(10e18) / 3600 / 24 / 7)) / 4);
        assertEq(
            token2.balanceOf(alice),
            1648e18 / 1000 - 2 + ((40 + 24 * 3600) * 3 * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        );
        assertEq(token4.balanceOf(bob), 0);
        assertEq(token4.balanceOf(alice), (24 * 3600 * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4);
        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 +
                20002e18 /
                10000 +
                10 -
                1998e18 /
                1000 -
                (50 * uint256(10e18)) /
                (3600 * 24 * 7) /
                4 -
                ((40 + 24 * 3600) * 3 * (uint256(10e18) / 3600 / 24 / 7)) /
                4 /
                4
        );
        _validateRewardDetails(
            token4,
            20,
            uint256(100e18) / (3600 * 24 * 30),
            token4Start,
            token4End,
            true,
            100e18 - (24 * 3600 * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4
        );
        _validateBalances(token1, aliceInit, 3e18, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 0, bobInit3, 0);

        console.log("23.2");

        staking.deposit(token3, 500e18);
        _validatePendingReward(token1, token2, alice, 0); // rounding is pretty brutal here? 4c
        _validatePendingReward(token1, token2, bob, (21600 * (uint256(10e18) / 3600 / 24 / 7)) / 4);
        _validatePendingReward(token3, token2, alice, 0);
        _validatePendingReward(token3, token2, bob, 0);
        _validatePendingReward(token1, token4, alice, 0);
        _validatePendingReward(token1, token4, bob, (24 * 3600 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4);
        _validatePendingReward(token3, token4, alice, 0);
        _validatePendingReward(token3, token4, bob, 0);

        assertEq(token2.balanceOf(bob), 350e18 / 1000 + (50 * (uint256(10e18) / 3600 / 24 / 7)) / 4);
        assertEq(
            token2.balanceOf(alice),
            1648e18 / 1000 - 2 + ((40 + 24 * 3600) * 3 * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        );
        assertEq(token4.balanceOf(bob), 0);
        assertEq(token4.balanceOf(alice), (24 * 3600 * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4);
        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 +
                20002e18 /
                10000 +
                10 -
                1998e18 /
                1000 -
                (50 * uint256(10e18)) /
                (3600 * 24 * 7) /
                4 -
                ((40 + 24 * 3600) * 3 * (uint256(10e18) / 3600 / 24 / 7)) /
                4 /
                4
        );
        _validateRewardDetails(
            token4,
            20,
            uint256(100e18) / (3600 * 24 * 30),
            token4Start,
            token4End,
            true,
            100e18 - (24 * 3600 * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4
        );
        _validateBalances(token1, aliceInit, 3e18, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 500e18, bobInit3, 0);

        skip(100 * 24 * 3600); // All rewards are fully distributed now.
        console.log("24.0");
        _validatePendingReward(
            token1,
            token2,
            alice,
            ((24 * 3600 * 6 - 50) * 3 * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        ); // rounding is pretty brutal here? 4c
        _validatePendingReward(token1, token2, bob, ((24 * 3600 * 7 - 50) * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4);
        _validatePendingReward(
            token3,
            token2,
            alice,
            ((24 * 3600 * 6 - 50) * 3 * (uint256(10e18) / 3600 / 24 / 7)) / 4
        );
        _validatePendingReward(token3, token2, bob, 0);
        _validatePendingReward(
            token1,
            token4,
            alice,
            ((24 * 3600 * 29 - 50) * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4
        );
        _validatePendingReward(
            token1,
            token4,
            bob,
            ((24 * 3600 * 30 - 50) * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4
        );
        _validatePendingReward(token3, token4, alice, ((24 * 3600 * 29 - 50) * (uint256(100e18) / 3600 / 24 / 30)) / 2);
        _validatePendingReward(token3, token4, bob, 0);

        assertEq(token2.balanceOf(bob), 350e18 / 1000 + (50 * (uint256(10e18) / 3600 / 24 / 7)) / 4);
        assertEq(
            token2.balanceOf(alice),
            1648e18 / 1000 - 2 + ((40 + 24 * 3600) * 3 * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        );
        assertEq(token4.balanceOf(bob), 0);
        assertEq(token4.balanceOf(alice), (24 * 3600 * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4);
        _validateRewardDetails(
            token2,
            40,
            uint256(10e18) / (3600 * 24 * 7),
            token2Start,
            token2End,
            true,
            10e18 +
                20002e18 /
                10000 +
                10 -
                1998e18 /
                1000 -
                (50 * uint256(10e18)) /
                (3600 * 24 * 7) /
                4 -
                ((40 + 24 * 3600) * 3 * (uint256(10e18) / 3600 / 24 / 7)) /
                4 /
                4
        );
        _validateRewardDetails(
            token4,
            20,
            uint256(100e18) / (3600 * 24 * 30),
            token4Start,
            token4End,
            true,
            100e18 - (24 * 3600 * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4
        );
        _validateBalances(token1, aliceInit, 3e18, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 500e18, bobInit3, 0);

        console.log("24.1");
        staking.withdraw(token1, staking.balanceOf(token1, alice));
        _validatePendingReward(token1, token2, alice, 0); // rounding is pretty brutal here? 4c
        _validatePendingReward(
            token3,
            token2,
            alice,
            ((24 * 3600 * 6 - 50) * 3 * (uint256(10e18) / 3600 / 24 / 7)) / 4
        );
        _validatePendingReward(token1, token4, alice, 0);
        _validatePendingReward(token3, token4, alice, ((24 * 3600 * 29 - 50) * (uint256(100e18) / 3600 / 24 / 30)) / 2);

        assertEq(
            token2.balanceOf(alice),
            1648e18 / 1000 - 2 + ((24 * 3600 * 7 - 10) * 3 * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        );
        assertEq(token4.balanceOf(alice), ((24 * 3600 * 30 - 50) * 3 * (uint256(100e18) / 3600 / 24 / 30)) / 2 / 4);
        _validateBalances(token1, aliceInit, 0, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 500e18, bobInit3, 0);

        console.log("24.2");

        {
            vm.startPrank(rewardAdmin);
            uint256 balBefore = token4.balanceOf(address(rewarder));

            vm.expectEmit();
            emit IMultiRewarder.RewardStopped(address(token4), address(this), true);
            rewarder.stopReward(address(token4), address(this), true);
            assertEq(token4.balanceOf(address(this)), balBefore);
            _validateRewardDetails(token4, 0, 0, 0, 0, false, 0);
            (address[] memory rewardTokens, uint256[] memory amounts) = rewarder.getRewards(token1, bob);
            assertEq(rewardTokens.length, 1);
            assertEq(amounts.length, 1);
            assertEq(rewardTokens[0], address(token2));
            assertEq(amounts[0], ((24 * 3600 * 7 - 50) * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4);

            (rewardTokens, amounts) = rewarder.getRewards(token3, bob);
            assertEq(rewardTokens.length, 1);
            assertEq(amounts.length, 1);
            assertEq(rewardTokens[0], address(token2));
            assertEq(amounts[0], 0);
            uint48[] memory allocPoints;
            (rewardTokens, allocPoints) = rewarder.allocPointsByStake(token1);
            assertEq(rewardTokens.length, 1);
            assertEq(allocPoints.length, 1);
            assertEq(rewardTokens[0], address(token2));
            assertEq(allocPoints[0], 10);

            (rewardTokens, allocPoints) = rewarder.allocPointsByStake(token3);
            assertEq(rewardTokens.length, 1);
            assertEq(allocPoints.length, 1);
            assertEq(rewardTokens[0], address(token2));
            assertEq(allocPoints[0], 30);

            rewardTokens = rewarder.rewardTokens();
            assertEq(rewardTokens.length, 1);
            assertEq(rewardTokens[0], address(token2));
        }

        vm.startPrank(bob);

        console.log("24.3");
        staking.withdraw(token1, staking.balanceOf(token1, bob));
        _validatePendingReward(token1, token2, bob, 0);
        _validatePendingReward(token3, token2, bob, 0);

        assertEq(
            token2.balanceOf(bob),
            350e18 / 1000 + ((24 * 3600 * 7 + 150) * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        );
        assertEq(token4.balanceOf(bob), 0);
        _validateBalances(token1, aliceInit, 0, bobInit, 0);
        _validateBalances(token3, aliceInit3, 500e18, bobInit3, 0);

        console.log("24.4");
        staking.deposit(token1, 1e18);

        assertEq(
            token2.balanceOf(bob),
            350e18 / 1000 + ((24 * 3600 * 7 + 150) * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        );
        assertEq(token4.balanceOf(bob), 0);
        _validateBalances(token1, aliceInit, 0, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 500e18, bobInit3, 0);

        skip(10);
        console.log("25.0");
        token4Start = _now();
        token4End = _now() + 24 * 3600;
        _setRewards(token4, 1000e18, token4Start, token4End - token4Start);
        _validateRewardDetails(token4, 0, uint256(1000e18) / (24 * 3600), token4Start, token4End, true, 1000e18);

        skip(3600);
        console.log("25.1");

        _setAllocPoint(address(token4), token1, 90);
        _validateRewardDetails(token4, 90, uint256(1000e18) / (24 * 3600), token4Start, token4End, true, 1000e18);

        {
            (address[] memory rewardTokens, uint256[] memory amounts) = rewarder.getRewards(token1, bob);
            assertEq(rewardTokens.length, 2);
            assertEq(amounts.length, 2);
            assertEq(rewardTokens[0], address(token2));
            assertEq(rewardTokens[1], address(token4));
            assertEq(amounts[0], 0);
            assertEq(amounts[1], 0);

            (rewardTokens, amounts) = rewarder.getRewards(token3, bob);
            assertEq(rewardTokens.length, 1);
            assertEq(amounts.length, 1);
            assertEq(rewardTokens[0], address(token2));
            assertEq(amounts[0], 0);
            uint48[] memory allocPoints;
            (rewardTokens, allocPoints) = rewarder.allocPointsByStake(token1);
            assertEq(rewardTokens.length, 2);
            assertEq(allocPoints.length, 2);
            assertEq(rewardTokens[0], address(token2));
            assertEq(rewardTokens[1], address(token4));
            assertEq(allocPoints[0], 10);
            assertEq(allocPoints[1], 90);

            (rewardTokens, allocPoints) = rewarder.allocPointsByStake(token3);
            assertEq(rewardTokens.length, 1);
            assertEq(allocPoints.length, 1);
            assertEq(rewardTokens[0], address(token2));
            assertEq(allocPoints[0], 30);

            rewardTokens = rewarder.rewardTokens();
            assertEq(rewardTokens.length, 2);
            assertEq(rewardTokens[0], address(token2));
            assertEq(rewardTokens[1], address(token4));
        }

        console.log("25.2");
        staking.deposit(token1, 0);
        _validatePendingReward(token1, token2, bob, 0);
        _validatePendingReward(token1, token4, bob, 0);
        _validateRewardDetails(token4, 90, uint256(1000e18) / (24 * 3600), token4Start, token4End, true, 1000e18);
        assertEq(
            token2.balanceOf(bob),
            350e18 / 1000 + ((24 * 3600 * 7 + 150) * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        );
        assertEq(token4.balanceOf(bob), 0);

        skip(3600);
        console.log("26.0");
        _validatePendingReward(token1, token2, bob, 0);
        _validatePendingReward(token1, token4, bob, 3600 * (uint256(1000e18) / 24 / 3600));
        _validateRewardDetails(token4, 90, uint256(1000e18) / (24 * 3600), token4Start, token4End, true, 1000e18);

        staking.deposit(token1, 0);
        _validatePendingReward(token1, token2, bob, 0);
        _validatePendingReward(token1, token4, bob, 0);
        _validateRewardDetails(
            token4,
            90,
            uint256(1000e18) / (24 * 3600),
            token4Start,
            token4End,
            true,
            1000e18 - 3600 * (uint256(1000e18) / 24 / 3600)
        );

        assertEq(
            token2.balanceOf(bob),
            350e18 / 1000 + ((24 * 3600 * 7 + 150) * (uint256(10e18) / 3600 / 24 / 7)) / 4 / 4
        );
        assertEq(token4.balanceOf(bob), 3600 * (uint256(1000e18) / 24 / 3600));

        skip(3600);
        console.log("27.0");
        StakingReceiverMock mock = new StakingReceiverMock();
        _validateBalances(token1, aliceInit, 0, bobInit, 1e18);
        _validateBalances(token3, aliceInit3, 500e18, bobInit3, 0);
        _validatePendingReward(token1, token4, bob, 3600 * (uint256(1000e18) / 24 / 3600));
        staking.withdrawToAndCall(token1, mock, staking.balanceOf(token1, bob), abi.encode(claude));
        _validateRewardDetails(
            token4,
            90,
            uint256(1000e18) / (24 * 3600),
            token4Start,
            token4End,
            true,
            1000e18 - 2 * 3600 * (uint256(1000e18) / 24 / 3600)
        );
        _validateBalances(token1, aliceInit, 0, bobInit - 1e18, 0);
        _validateBalances(token3, aliceInit3, 500e18, bobInit3, 0);
        assertEq(token1.balanceOf(claude), 1e18);
        assertEq(token4.balanceOf(bob), 2 * 3600 * (uint256(1000e18) / 24 / 3600));
        assertEq(token4.balanceOf(claude), 0);

        console.log("27.1");
        uint48 ethStart = _now();
        uint48 ethEnd = ethStart + 24 * 3600;
        _setRewards(TestToken(ETH), 10e18, ethStart, ethEnd - ethStart);
        _validateRewardDetails(TestToken(ETH), 0, uint256(10e18) / (24 * 3600), ethStart, ethEnd, true, uint256(10e18));

        console.log("27.2");
        _setAllocPoint(ETH, token1, 100);
        _validateRewardDetails(
            TestToken(ETH),
            100,
            uint256(10e18) / (24 * 3600),
            ethStart,
            ethEnd,
            true,
            uint256(10e18)
        );

        console.log("27.3");
        vm.startPrank(bob);
        assertEq(bob.balance, 0);
        staking.deposit(token1, 100e18);
        _validateRewardDetails(
            TestToken(ETH),
            100,
            uint256(10e18) / (24 * 3600),
            ethStart,
            ethEnd,
            true,
            uint256(10e18)
        );
        assertEq(bob.balance, 0);

        skip(24 * 3600);
        console.log("28.0");
        _validatePendingReward(token1, TestToken(ETH), bob, 24 * 3600 * (uint256(10e18) / 24 / 3600));
        staking.deposit(token1, 0);
        _validatePendingReward(token1, TestToken(ETH), bob, 0);
        _validateRewardDetails(
            TestToken(ETH),
            100,
            uint256(10e18) / (24 * 3600),
            ethStart,
            ethEnd,
            true,
            10e18 - 24 * 3600 * (uint256(10e18) / 24 / 3600)
        );
        assertEq(bob.balance, 24 * 3600 * (uint256(10e18) / 24 / 3600));

        console.log("28.1");
        staking.withdraw(token1, 0);
        _validatePendingReward(token1, TestToken(ETH), bob, 0);
        _validateRewardDetails(
            TestToken(ETH),
            100,
            uint256(10e18) / (24 * 3600),
            ethStart,
            ethEnd,
            true,
            10e18 - 24 * 3600 * (uint256(10e18) / 24 / 3600)
        );
        assertEq(bob.balance, 24 * 3600 * (uint256(10e18) / 24 / 3600));

        console.log("28.2");
        staking.emergencyWithdraw(token1);
        _validatePendingReward(token1, TestToken(ETH), bob, 0);
        _validateRewardDetails(
            TestToken(ETH),
            100,
            uint256(10e18) / (24 * 3600),
            ethStart,
            ethEnd,
            true,
            10e18 - 24 * 3600 * (uint256(10e18) / 24 / 3600)
        );
        assertEq(bob.balance, 24 * 3600 * (uint256(10e18) / 24 / 3600));

        vm.expectEmit();
        emit IMultiRewarder.RewardStopped(address(ETH), claude, true);
        vm.startPrank(rewardAdmin);
        rewarder.stopReward(ETH, claude, true);
        assertEq(claude.balance, 10e18 - 24 * 3600 * (uint256(10e18) / 24 / 3600));
        _validateRewardDetails(TestToken(ETH), 0, 0, 0, 0, false, 0);
    }

    /**
     * REPEATED TESTS FROM UNIT TESTS: MULTI REWARDER
     */
    function _setRewards(TestToken rewardToken, uint256 amount, uint48 start, uint48 duration) internal {
        (, address msgSender, ) = vm.readCallers();
        if (msgSender != rewardAdmin) vm.startPrank(rewardAdmin);
        if (address(rewardToken) != ETH) {
            rewardToken.mint(rewardAdmin, amount);
            rewardToken.approve(address(rewarder), amount);
        } else {
            // Send eth to rewardADmin
            deal(rewardAdmin, amount);
        }
        uint48 oldEnd = rewarder.rewardDetails(address(rewardToken)).end;
        uint48 oldStart = rewarder.rewardDetails(address(rewardToken)).start;
        uint256 amountToAdd = amount;
        if (oldEnd > _now()) {
            uint48 maxStart = _now() > oldStart ? _now() : oldStart;
            amountToAdd += (oldEnd - maxStart) * rewarder.rewardDetails(address(rewardToken)).rewardPerSec;
        }

        uint256 value = address(rewardToken) == ETH ? amount : 0;
        vm.expectEmit(address(rewarder));
        emit IMultiRewarder.RewardSet(address(rewardToken), amount, amountToAdd, start, duration);
        rewarder.setReward{ value: value }(address(rewardToken), amount, start, duration);

        if (msgSender != rewardAdmin) {
            vm.stopPrank();
            vm.startPrank(msgSender);
        }
    }

    function test_revert_withdrawToAndCallEOA() public {
        _addToken(token1);
        token1.mint(alice, 100);
        vm.startPrank(alice);
        token1.approve(address(staking), 100);
        staking.deposit(token1, 100);
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.InvalidReceiver.selector, (bob)));
        staking.withdrawToAndCall(token1, IStakingReceiver(bob), 100, "");
    }

    function test_withdrawToAndCall() public {
        StakingReceiverMock receiver = new StakingReceiverMock();
        _addToken(token1);
        token1.mint(alice, 100);
        vm.startPrank(alice);
        token1.approve(address(staking), 100);
        staking.deposit(token1, 100);
        staking.withdrawToAndCall(token1, receiver, 100, abi.encode(bob));

        assertEq(token1.balanceOf(bob), 100);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
    }

    function test_revert_withdrawToAndCall() public {
        StakingReceiverMock receiver = new StakingReceiverMock();
        receiver.setRevert(true);
        _addToken(token1);
        token1.mint(alice, 100);
        vm.startPrank(alice);
        token1.approve(address(staking), 100);
        staking.deposit(token1, 100);
        vm.expectRevert();
        staking.withdrawToAndCall(token1, receiver, 100, abi.encode(bob));
    }

    function test_revert_withdrawToAndCallWrongSelector() public {
        StakingReceiverMock receiver = new StakingReceiverMock();
        receiver.setReturnSelector(bytes4(0x12341234));
        _addToken(token1);
        token1.mint(alice, 100);
        vm.startPrank(alice);
        token1.approve(address(staking), 100);
        staking.deposit(token1, 100);
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.InvalidReceiver.selector, (receiver)));
        staking.withdrawToAndCall(token1, receiver, 100, abi.encode(bob));
    }

    function _extendRewards(TestToken rewardToken, uint256 amount) internal {
        (, address msgSender, ) = vm.readCallers();
        if (msgSender != rewardAdmin) vm.startPrank(rewardAdmin);
        uint256 value = address(rewardToken) == ETH ? amount : 0;
        if (address(rewardToken) != ETH) {
            rewardToken.mint(rewardAdmin, amount);
            rewardToken.approve(address(rewarder), amount);
        }
        uint48 oldEnd = rewarder.rewardDetails(address(rewardToken)).end;
        uint256 rewardRate = rewarder.rewardDetails(address(rewardToken)).rewardPerSec;
        vm.expectEmit(address(rewarder));
        emit IMultiRewarder.RewardExtended(address(rewardToken), amount, oldEnd + uint48(amount / rewardRate));
        rewarder.extendReward{ value: value }(address(rewardToken), amount);

        if (msgSender != rewardAdmin) {
            vm.stopPrank();
            vm.startPrank(msgSender);
        }
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
        vm.startPrank(rewardAdmin);
        token1.mint(rewardAdmin, 53);
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
        token1.mint(rewardAdmin, 53);
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

        token1.mint(rewardAdmin, 53);
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

        token1.mint(rewardAdmin, 53);
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
        token1.mint(rewardAdmin, 53);
        token1.approve(address(rewarder), 53);
        vm.expectRevert(abi.encodeWithSelector(IMultiRewarder.MultiRewarderPoolFinished.selector, address(token1)));
        rewarder.extendReward(address(token1), 53);
    }

    function test_revert_extendRewardNonExistentReward() public {
        vm.startPrank(rewardAdmin);
        token1.mint(rewardAdmin, 100);
        token1.approve(address(rewarder), 100);
        vm.expectRevert(
            abi.encodeWithSelector(IMultiRewarder.MultiRewarderUnregisteredToken.selector, address(token1))
        );
        rewarder.extendReward(address(token1), 100);
    }

    function test_revert_setRewardsRequiresTokenApproval() public {
        vm.startPrank(rewardAdmin);
        token1.mint(rewardAdmin, 100);
        vm.expectRevert();
        rewarder.setReward(address(token1), 100, _now(), 10);
    }

    function testFuzz_revert_setRewardsRequiresTokenApproval(uint256 amount) public {
        vm.startPrank(rewardAdmin);
        token1.mint(rewardAdmin, amount);
        if (amount > 0) {
            vm.expectRevert();
        } else {
            vm.expectRevert(IMultiRewarder.MultiRewarderZeroRewardRate.selector);
        }
        rewarder.setReward(address(token1), amount, _now(), 10);
    }

    function test_revert_setRewardsRequiresTokens() public {
        vm.startPrank(rewardAdmin);
        token1.mint(rewardAdmin, 100);
        token1.approve(address(rewarder), 101);
        vm.expectRevert();
        rewarder.setReward(address(token1), 101, _now(), 10);
    }

    function test_revert_setRewardsInPast() public {
        vm.startPrank(rewardAdmin);
        token1.mint(rewardAdmin, 100);
        token1.approve(address(rewarder), 101);
        vm.expectRevert(abi.encodeWithSelector(IMultiRewarder.MultiRewarderStartInPast.selector, _now() - 1));
        rewarder.setReward(address(token1), 10, _now() - 1, 10);
    }

    function testFuzz_revert_setRewardsStartInPast(uint48 start) public {
        vm.startPrank(rewardAdmin);
        token1.mint(rewardAdmin, 100);
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
        vm.startPrank(rewardAdmin);
        token1.mint(rewardAdmin, minted);
        token1.approve(address(rewarder), approved);
        if (actual / 10 == 0) {
            vm.expectRevert(IMultiRewarder.MultiRewarderZeroRewardRate.selector);
        } else if (minted < actual || approved < actual) {
            vm.expectRevert();
        }

        rewarder.setReward(address(token1), actual, _now(), 10);
    }

    function test_revert_nonOwner() public {
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

    function test_revert_nonStaking() public {
        vm.expectRevert(abi.encodeWithSelector(IRewarder.MultiRewarderUnauthorizedCaller.selector, address(this)));
        rewarder.connect(token1);
        vm.expectRevert(abi.encodeWithSelector(IRewarder.MultiRewarderUnauthorizedCaller.selector, address(this)));
        rewarder.onUpdate(token1, address(this), 0, 0, 0);
    }

    function test_revert_alreadyConnected() public {
        vm.startPrank(address(staking));
        vm.expectEmit();
        emit IRewarder.RewarderConnected(token1);
        rewarder.connect(token1);
        vm.expectRevert(abi.encodeWithSelector(IRewarder.RewarderAlreadyConnected.selector, token1));
        rewarder.connect(token1);
        vm.stopPrank();
    }

    function test_stakingView() public {
        assertEq(address(rewarder.staking()), address(staking));
    }

    function test_getRewardsOnNonExistentPoolReturnsEmptyArraysAndDoesNotDoCalls() public {
        (address[] memory tokens, uint256[] memory amounts) = rewarder.getRewards(token1, alice);
        assertEq(tokens.length, 0);
        assertEq(amounts.length, 0);
    }

    /**
     * REPEATED TESTS FROM UNIT TESTS: STAKING
     */
    function test_revert_setPoolWithoutOwner() external {
        assertEq(staking.owner(), stakingAdmin);
        vm.startPrank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        staking.setPool(token1, rewarder);
        vm.stopPrank();
    }

    function testSetPool() external {
        vm.stopPrank();
        vm.startPrank(stakingAdmin);
        assertEq(staking.owner(), stakingAdmin);
        assertEq(staking.isPool(token1), false);
        assertEq(address(staking.rewarder(token1)), address(0));
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.tokensLength(), 0);

        assertEq(staking.isPool(token2), false);
        assertEq(address(staking.rewarder(token2)), address(0));
        assertEq(staking.totalSupply(token2), 0);

        vm.expectEmit(address(staking));
        emit IStargateStaking.PoolSet(token1, rewarder, false);
        staking.setPool(token1, rewarder);

        assertEq(staking.isPool(token1), true);
        assertEq(address(staking.rewarder(token1)), address(rewarder));
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.tokensLength(), 1);
        assertEq(address(staking.tokens()[0]), address(token1));
        assertEq(staking.tokens().length, 1);

        assertEq(staking.isPool(token2), false);
        assertEq(address(staking.rewarder(token2)), address(0));
        assertEq(staking.totalSupply(token2), 0);

        StargateMultiRewarder r2 = new StargateMultiRewarder(staking);

        vm.expectEmit(address(staking));
        emit IStargateStaking.PoolSet(token2, r2, false);
        staking.setPool(token2, r2);

        assertEq(staking.isPool(token1), true);
        assertEq(address(staking.rewarder(token1)), address(rewarder));
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.tokensLength(), 2);
        assertEq(address(staking.tokens()[0]), address(token1));
        assertEq(address(staking.tokens()[1]), address(token2));
        assertEq(staking.tokens().length, 2);

        assertEq(staking.isPool(token2), true);
        assertEq(address(staking.rewarder(token2)), address(r2));
        assertEq(staking.totalSupply(token2), 0);

        // Change rewarder for token1
        StargateMultiRewarder r3 = new StargateMultiRewarder(staking);

        vm.expectEmit(address(staking));
        emit IStargateStaking.PoolSet(token1, r3, true);
        staking.setPool(token1, r3);
        assertEq(staking.isPool(token1), true);
        assertEq(address(staking.rewarder(token1)), address(r3));
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.tokensLength(), 2);
        assertEq(address(staking.tokens()[0]), address(token1));
        assertEq(address(staking.tokens()[1]), address(token2));
        assertEq(staking.tokens().length, 2);

        assertEq(staking.isPool(token2), true);
        assertEq(address(staking.rewarder(token2)), address(r2));
        assertEq(staking.totalSupply(token2), 0);

        assertEq(address(staking.tokens(0, 1)[0]), address(token1));
        assertEq(staking.tokens(0, 1).length, 1);

        assertEq(address(staking.tokens(1, 2)[0]), address(token2));
        assertEq(staking.tokens(1, 2).length, 1);

        assertEq(address(staking.tokens(0, 2)[0]), address(token1));
        assertEq(address(staking.tokens(0, 2)[1]), address(token2));
        assertEq(staking.tokens(0, 2).length, 2);
    }

    function test_deposit() external {
        _addToken(token1);
        token1.mint(address(this), 100);
        token1.approve(address(staking), 100);
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.balanceOf(token1, address(this)), 0);
        assertEq(staking.balanceOf(token1, alice), 0);
        uint256 thisBalBefore = token1.balanceOf(address(this));
        uint256 stakingBalBefore = token1.balanceOf(address(staking));
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, address(this), 0, 0, 100))
        ); // token, user, oldStake, oldSupply, newStake
        staking.deposit(token1, 100);
        assertEq(token1.balanceOf(address(this)), thisBalBefore - 100);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + 100);
        assertEq(staking.totalSupply(token1), 100);
        assertEq(staking.balanceOf(token1, address(this)), 100);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
    }

    function testFuzz_depositsAndWithdrawals(
        uint256 amountDep1,
        uint256 amountWithdrawal,
        uint256 amountDep2,
        uint256 aliceDep1,
        uint256 aliceApproval
    ) external {
        unchecked {
            vm.assume(amountDep1 + amountDep2 >= amountDep1);
        } // overflow in token mint
        unchecked {
            vm.assume(amountDep1 + amountDep2 + aliceDep1 >= amountDep1 + amountDep2);
        } // overflow in token mint

        _addToken(token1);
        token1.mint(address(this), amountDep1);
        token1.mint(address(this), amountDep2);
        token1.mint(alice, aliceDep1);
        token1.approve(address(staking), amountDep1 + amountDep2);
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.balanceOf(token1, address(this)), 0);
        assertEq(staking.balanceOf(token1, alice), 0);
        uint256 thisBalBefore = token1.balanceOf(address(this));
        uint256 stakingBalBefore = token1.balanceOf(address(staking));

        uint256 supply = 0;
        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, address(this), address(this), amountDep1);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, address(this), supply, supply, amountDep1))
        ); // token, user, oldStake, oldSupply, newStake
        staking.deposit(token1, amountDep1);
        supply = amountDep1;
        assertEq(token1.balanceOf(address(this)), thisBalBefore - amountDep1);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + amountDep1);
        assertEq(staking.totalSupply(token1), supply);
        assertEq(staking.balanceOf(token1, address(this)), supply);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);

        if (amountWithdrawal > amountDep1) {
            vm.expectRevert();
            staking.withdraw(token1, amountWithdrawal);
            return;
        }

        vm.expectEmit(address(staking));
        emit IStargateStaking.Withdraw(token1, address(this), address(this), amountWithdrawal, true);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, address(this), supply, supply, supply - amountWithdrawal))
        ); // token, user, oldStake, oldSupply, newStake
        staking.withdraw(token1, amountWithdrawal);
        supply = supply - amountWithdrawal;

        assertEq(token1.balanceOf(address(this)), thisBalBefore - supply);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + supply);
        assertEq(staking.totalSupply(token1), supply);
        assertEq(staking.balanceOf(token1, address(this)), supply);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, address(this), address(this), amountDep2);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, address(this), supply, supply, supply + amountDep2))
        ); // token, user, oldStake, oldSupply, newStake
        staking.deposit(token1, amountDep2);
        supply = supply + amountDep2;

        assertEq(token1.balanceOf(address(this)), thisBalBefore - supply);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + supply);
        assertEq(staking.totalSupply(token1), supply);
        assertEq(staking.balanceOf(token1, address(this)), supply);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);

        vm.startPrank(alice);
        token1.approve(address(staking), aliceApproval);

        if (aliceApproval < aliceDep1) {
            vm.expectRevert();
            staking.deposit(token1, aliceDep1);
            return;
        }

        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, alice, 0, supply, aliceDep1))
        ); // token, user, oldStake, oldSupply, newStake
        staking.deposit(token1, aliceDep1);
        supply = supply + aliceDep1;
        vm.stopPrank();
        assertEq(staking.totalSupply(token1), supply);
        assertEq(staking.balanceOf(token1, address(this)), supply - aliceDep1);
        assertEq(staking.balanceOf(token1, alice), aliceDep1);
        assertEq(staking.balanceOf(token1, bob), 0);
        assertEq(token1.balanceOf(address(this)), thisBalBefore + aliceDep1 - supply);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + supply);
        assertEq(token1.balanceOf(alice), 0);

        vm.startPrank(alice);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Withdraw(token1, alice, alice, aliceDep1, false);
        staking.emergencyWithdraw(token1);
        vm.stopPrank();
        assertEq(staking.totalSupply(token1), amountDep1 - amountWithdrawal + amountDep2);
        assertEq(staking.balanceOf(token1, address(this)), amountDep1 - amountWithdrawal + amountDep2);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
        assertEq(token1.balanceOf(address(this)), thisBalBefore - amountDep1 + amountWithdrawal - amountDep2);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + amountDep1 - amountWithdrawal + amountDep2);
        assertEq(token1.balanceOf(alice), aliceDep1);
    }

    function test_emptyDeposit() external {
        assertEq(staking.balanceOf(token1, address(this)), 0);
        assertEq(staking.totalSupply(token1), 0);
        _addToken(token1);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, address(this), address(this), 0);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, address(this), 0, 0, 0))
        ); // token, user, oldStake, oldSupply, newStake
        staking.deposit(token1, 0);
        assertEq(staking.balanceOf(token1, address(this)), 0);
        assertEq(staking.totalSupply(token1), 0);
    }

    function test_revert_emptyDepositInUnconfiguredPool() external {
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.deposit(token1, 0);
    }

    function testFuzz_revert_emptyDepositInUnconfiguredPool(
        uint256 deposit,
        uint256 balance,
        uint256 approval
    ) external {
        token1.mint(address(this), balance);
        token1.approve(address(staking), approval);
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.deposit(token1, deposit);
    }

    function test_revert_depositWithInsufficientAllowanceAndBalance() external {
        _addToken(token1);
        vm.expectRevert();
        staking.deposit(token1, 100);
    }

    function testFuzz_revert_insufficientAllowanceAndBalance(
        uint256 allowance,
        uint256 balance,
        uint256 deposit
    ) external {
        vm.assume(allowance < deposit);
        vm.assume(balance < deposit);
        _addToken(token1);
        vm.expectRevert();
        staking.deposit(token1, deposit);
    }

    function test_insufficientAllowance() external {
        _addToken(token1);
        token1.mint(alice, 100);
        vm.expectRevert();
        staking.deposit(token1, 100);
    }

    function testFuzz_revert_insufficientAllowance(uint256 allowance, uint256 balance, uint256 deposit) external {
        vm.assume(allowance < deposit);
        vm.assume(balance >= deposit);
        _addToken(token1);
        vm.expectRevert();
        staking.deposit(token1, deposit);
    }

    function test_revert_insufficientBalance() external {
        _addToken(token1);
        token1.approve(address(staking), 100);
        vm.expectRevert();
        staking.deposit(token1, 100);
    }

    function testFuzz_revert_insufficientBalance(uint256 allowance, uint256 balance, uint256 deposit) external {
        _addToken(token1);
        vm.assume(allowance >= deposit);
        vm.assume(balance < deposit);
        vm.expectRevert();
        staking.deposit(token1, 100);
    }

    function test_DepositWithdrawRevertsAndEmergencyWithdrawSucceedsOnBrokenRewarder() external {
        _addToken(token1);
        token1.mint(address(this), 100);
        token1.approve(address(staking), 200);
        uint256 balBefore = token1.balanceOf(address(this));

        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, address(this), address(this), 100);
        staking.deposit(token1, 100);
        assertEq(staking.totalSupply(token1), 100);
        assertEq(staking.balanceOf(token1, address(this)), 100);
        assertEq(token1.balanceOf(address(staking)), 100);
        assertEq(token1.balanceOf(address(this)), balBefore - 100);

        vm.startPrank(rewardAdmin);
        token2.mint(rewardAdmin, 100);
        token2.approve(address(rewarder), 100);
        rewarder.setReward(address(token2), 100, _now(), 10);
        _setAllocPoint(address(token2), token1, 100);
        token2.setPaused(true);
        skip(1); // accrue some rewards on our deposit.
        vm.startPrank(address(this));
        vm.expectRevert();
        staking.withdraw(token1, 100);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Withdraw(token1, address(this), address(this), 100, false);
        staking.emergencyWithdraw(token1);
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.balanceOf(token1, address(this)), 0);
        assertEq(token1.balanceOf(address(this)), balBefore);
        assertEq(token1.balanceOf(address(staking)), 0);

        staking.deposit(token1, 100);
        assertEq(token1.balanceOf(address(this)), balBefore - 100);
        assertEq(staking.totalSupply(token1), 100);
    }

    function test_revert_depositToFromEoaAntiPhishing() external {
        vm.stopPrank();
        vm.startPrank(alice);
        token1.mint(alice, 100);
        _addToken(token1);
        vm.expectRevert(IStargateStaking.InvalidCaller.selector);
        staking.depositTo(token1, bob, 100);
    }

    function test_depositTo() external {
        _addToken(token1);
        DepositorMock depositor = new DepositorMock();
        token1.mint(address(depositor), 100);

        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.balanceOf(token1, address(depositor)), 0);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
        uint256 depositorBalBefore = token1.balanceOf(address(depositor));
        uint256 stakingBalBefore = token1.balanceOf(address(staking));
        uint256 aliceBalBefore = token1.balanceOf(alice);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, address(depositor), alice, 100);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, alice, 0, 0, 100))
        ); // token, user, oldStake, oldSupply, newStake
        depositor.depositTo(staking, token1, alice, 100, 100);
        assertEq(token1.balanceOf(address(depositor)), depositorBalBefore - 100);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + 100);
        assertEq(staking.totalSupply(token1), 100);
        assertEq(staking.balanceOf(token1, address(depositor)), 0);
        assertEq(staking.balanceOf(token1, alice), 100);
        assertEq(staking.balanceOf(token1, bob), 0);
        assertEq(token1.balanceOf(alice), aliceBalBefore);
    }

    function test_depositToWithExistingDeposit() external {
        _addToken(token1);
        token1.mint(alice, 50);
        _addToken(token2);
        token2.mint(alice, 30);
        vm.startPrank(alice);
        token1.approve(address(staking), 50);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, alice, alice, 50);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, alice, 0, 0, 50))
        ); // token, user, oldStake, oldSupply, newStake
        staking.deposit(token1, 50);
        token2.approve(address(staking), 50);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token2, alice, alice, 30);
        vm.expectCall(
            address(staking.rewarder(token2)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token2, alice, 0, 0, 30))
        ); // token, user, oldStake, oldSupply, newStake
        staking.deposit(token2, 30);
        vm.stopPrank();

        DepositorMock depositor = new DepositorMock();
        token1.mint(address(depositor), 100);

        assertEq(staking.totalSupply(token1), 50);
        assertEq(staking.balanceOf(token1, address(depositor)), 0);
        assertEq(staking.balanceOf(token1, alice), 50);
        assertEq(staking.balanceOf(token1, bob), 0);
        uint256 depositorBalBefore = token1.balanceOf(address(depositor));
        uint256 stakingBalBefore = token1.balanceOf(address(staking));
        uint256 aliceBalBefore = token1.balanceOf(alice);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, address(depositor), alice, 100);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, alice, 50, 50, 150))
        ); // token, user, oldStake, oldSupply, newStake
        depositor.depositTo(staking, token1, alice, 100, 100);
        assertEq(token1.balanceOf(address(depositor)), depositorBalBefore - 100);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + 100);
        assertEq(staking.totalSupply(token1), 150);
        assertEq(staking.balanceOf(token1, address(depositor)), 0);
        assertEq(staking.balanceOf(token1, alice), 150);
        assertEq(staking.balanceOf(token1, bob), 0);
        assertEq(token1.balanceOf(alice), aliceBalBefore);
    }

    function testFuzz_depositTo(
        address to,
        uint256 amountDepositor,
        uint256 amountDeposit,
        uint256 amountApproval
    ) external {
        vm.assume(to != address(0)); // 18446744073709551615. 2642, 8634
        _addToken(token1);
        DepositorMock depositor = new DepositorMock();
        vm.assume(to != address(depositor));
        vm.assume(to != address(staking));
        token1.mint(address(depositor), amountDepositor);

        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.balanceOf(token1, address(depositor)), 0);
        assertEq(staking.balanceOf(token1, to), 0);
        uint256 depositorBalBefore = token1.balanceOf(address(depositor));
        uint256 stakingBalBefore = token1.balanceOf(address(staking));
        uint256 aliceBalBefore = token1.balanceOf(to);
        if (amountApproval < amountDeposit || amountDepositor < amountDeposit) {
            vm.expectRevert();
            depositor.depositTo(staking, token1, to, amountDeposit, amountApproval);
            return;
        }
        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, address(depositor), to, amountDeposit);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, to, 0, 0, amountDeposit))
        ); // token, user, oldStake, oldSupply, newStake
        depositor.depositTo(staking, token1, to, amountDeposit, amountApproval);
        assertEq(token1.balanceOf(address(depositor)), depositorBalBefore - amountDeposit);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + amountDeposit);
        assertEq(staking.totalSupply(token1), amountDeposit);
        if (to != address(depositor)) {
            assertEq(staking.balanceOf(token1, address(depositor)), 0);
        }
        assertEq(staking.balanceOf(token1, to), amountDeposit);
        if (to != address(depositor)) {
            assertEq(token1.balanceOf(to), aliceBalBefore);
        }
    }

    function test_revert_operationsOnInvalidPool() external {
        _addToken(token2);

        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.deposit(token1, 100);
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.depositTo(token1, alice, 100);
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.withdraw(token1, 100);
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.withdrawToAndCall(token1, IStakingReceiver(alice), 100, "");
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.emergencyWithdraw(token1);
        IERC20[] memory tokens = new IERC20[](1);
        tokens[0] = token1;
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.claim(tokens);

        IERC20[] memory tokens2 = new IERC20[](2);
        tokens2[0] = token2;
        tokens2[0] = token1;
        vm.expectRevert(abi.encodeWithSelector(IStargateStaking.NonExistentPool.selector, token1));
        staking.claim(tokens2);

        assertEq(staking.balanceOf(token1, address(this)), 0);
        assertEq(staking.totalSupply(token1), 0);
    }
}

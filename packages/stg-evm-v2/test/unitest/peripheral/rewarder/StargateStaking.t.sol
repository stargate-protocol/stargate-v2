// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { StargateBaseTest, console } from "../../stargate/StargateBase.t.sol";
import { TestToken } from "../../../utils/TestToken.sol";
import { RewarderMock } from "../../../mocks/RewarderMock.sol";
import { DepositorMock } from "../../../mocks/DepositorMock.sol";

import { StakingLib, StargateStaking, IERC20, IRewarder, IStargateStaking, IStakingReceiver } from "../../../../src/peripheral/rewarder/StargateStaking.sol";

contract StargateStakingTest is StargateBaseTest {
    bytes4 internal REENTRANT_ERROR_SELECTOR = bytes4(keccak256("Error(string)"));
    string internal constant REENTRANT_ERROR = "ReentrancyGuard: reentrant call";

    StargateStakingMock staking;
    TestToken private token1;
    TestToken private token2;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public override {
        super.setUp();

        staking = new StargateStakingMock();
        token1 = new TestToken("Test1", "TST1", 0);
        token2 = new TestToken("Test2", "TST2", 0);
    }

    function _addToken(TestToken token) internal {
        staking.setPool(token, new RewarderMock());
    }

    function _assertReentrantError(bool _success, bytes memory _errorBytes) internal {
        assertFalse(_success);
        assertEq(REENTRANT_ERROR_SELECTOR, _getErrorSignature(_errorBytes));
        assertEq(abi.encode(REENTRANT_ERROR), _getError(_errorBytes));
    }

    function _getErrorSignature(bytes memory _error) internal pure returns (bytes4) {
        require(_error.length > 4, "error length must be more than 4 bytes");
        return abi.decode(_error, (bytes4));
    }

    function _getError(bytes memory _error) internal pure returns (bytes memory) {
        require(_error.length > 4, "error length must be more than 4 bytes");

        bytes memory result = new bytes(_error.length - 4);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = _error[i + 4];
        }
        return result;
    }

    function test_revert_setPoolWithoutOwner() external {
        assertEq(staking.owner(), address(this));
        vm.startPrank(alice);
        RewarderMock rewarder = new RewarderMock();
        vm.expectRevert("Ownable: caller is not the owner");
        staking.setPool(token1, rewarder);
        vm.stopPrank();
    }

    function testSetPool() external {
        assertEq(staking.owner(), address(this));
        assertEq(staking.isPool(token1), false);
        assertEq(address(staking.rewarder(token1)), address(0));
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.tokensLength(), 0);

        assertEq(staking.isPool(token2), false);
        assertEq(address(staking.rewarder(token2)), address(0));
        assertEq(staking.totalSupply(token2), 0);

        RewarderMock r = new RewarderMock();
        vm.expectEmit(address(staking));
        emit IStargateStaking.PoolSet(token1, r, false);
        staking.setPool(token1, r);

        assertEq(staking.isPool(token1), true);
        assertEq(address(staking.rewarder(token1)), address(r));
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.tokensLength(), 1);
        assertEq(address(staking.tokens()[0]), address(token1));
        assertEq(staking.tokens().length, 1);

        assertEq(staking.isPool(token2), false);
        assertEq(address(staking.rewarder(token2)), address(0));
        assertEq(staking.totalSupply(token2), 0);

        RewarderMock r2 = new RewarderMock();

        vm.expectEmit(address(staking));
        emit IStargateStaking.PoolSet(token2, r2, false);
        staking.setPool(token2, r2);

        assertEq(staking.isPool(token1), true);
        assertEq(address(staking.rewarder(token1)), address(r));
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.tokensLength(), 2);
        assertEq(address(staking.tokens()[0]), address(token1));
        assertEq(address(staking.tokens()[1]), address(token2));
        assertEq(staking.tokens().length, 2);

        assertEq(staking.isPool(token2), true);
        assertEq(address(staking.rewarder(token2)), address(r2));
        assertEq(staking.totalSupply(token2), 0);

        // Change rewarder for token1
        RewarderMock r3 = new RewarderMock();

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

        (bool success, bytes memory errorBytes) = staking.reentrantDeposit(token1, 100);
        _assertReentrantError(success, errorBytes);
    }

    function test_WithdrawalAmountExceedsBalance(uint256 _amount) external {
        vm.assume(_amount > 0);

        _addToken(token1);
        vm.expectRevert(StakingLib.WithdrawalAmountExceedsBalance.selector);
        staking.withdraw(token1, _amount);
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
            vm.expectRevert(StakingLib.WithdrawalAmountExceedsBalance.selector);
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

        RewarderMock(address(staking.rewarder(token1))).setRevert(true);
        vm.expectRevert();
        staking.withdraw(token1, 100);

        vm.expectEmit(address(staking));
        emit IStargateStaking.Withdraw(token1, address(this), address(this), 100, false);
        staking.emergencyWithdraw(token1);
        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.balanceOf(token1, address(this)), 0);
        assertEq(token1.balanceOf(address(this)), balBefore);
        assertEq(token1.balanceOf(address(staking)), 0);

        vm.expectRevert();
        staking.deposit(token1, 100);
    }

    function test_revert_depositToFromEoaAntiPhishing() external {
        _addToken(token1);
        vm.startPrank(alice);
        token1.mint(alice, 100);
        vm.expectRevert(IStargateStaking.InvalidCaller.selector);
        staking.depositTo(token1, bob, 100);
        vm.stopPrank();
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

        (bool success, bytes memory errorBytes) = staking.reentrantDepositTo(token1, alice, 100);
        _assertReentrantError(success, errorBytes);
    }

    function test_depositToSelf() external {
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
        emit IStargateStaking.Deposit(token1, address(depositor), address(depositor), 100);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, address(depositor), 0, 0, 100))
        ); // token, user, oldStake, oldSupply, newStake
        depositor.depositTo(staking, token1, address(depositor), 100, 100);
        assertEq(token1.balanceOf(address(depositor)), depositorBalBefore - 100);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + 100);
        assertEq(staking.totalSupply(token1), 100);
        assertEq(staking.balanceOf(token1, address(depositor)), 100);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
        assertEq(token1.balanceOf(alice), aliceBalBefore);
    }

    function test_depositToStaking() external {
        _addToken(token1);
        DepositorMock depositor = new DepositorMock();
        token1.mint(address(depositor), 100);

        assertEq(staking.totalSupply(token1), 0);
        assertEq(staking.balanceOf(token1, address(depositor)), 0);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
        uint256 depositorBalBefore = token1.balanceOf(address(depositor));
        uint256 stakingBalBefore = token1.balanceOf(address(staking));

        vm.expectEmit(address(staking));
        emit IStargateStaking.Deposit(token1, address(depositor), address(staking), 100);
        vm.expectCall(
            address(staking.rewarder(token1)),
            0,
            abi.encodeCall(IRewarder.onUpdate, (token1, address(staking), 0, 0, 100))
        ); // token, user, oldStake, oldSupply, newStake
        depositor.depositTo(staking, token1, address(staking), 100, 100);
        assertEq(token1.balanceOf(address(depositor)), depositorBalBefore - 100);
        assertEq(token1.balanceOf(address(staking)), stakingBalBefore + 100);
        assertEq(staking.totalSupply(token1), 100);
        assertEq(staking.balanceOf(token1, address(staking)), 100);
        assertEq(staking.balanceOf(token1, address(depositor)), 0);
        assertEq(staking.balanceOf(token1, alice), 0);
        assertEq(staking.balanceOf(token1, bob), 0);
    }

    function test_depositToWithExistingDeposit() external {
        _addToken(token1);
        _addToken(token2);
        token1.mint(alice, 50);
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
        vm.assume(to != address(0));
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
        assertEq(staking.balanceOf(token1, address(depositor)), 0);
        assertEq(staking.balanceOf(token1, to), amountDeposit);
        assertEq(token1.balanceOf(to), aliceBalBefore);
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

    function test_reentrantWithdrawReverts() external {
        (bool success, bytes memory errorBytes) = staking.reentrantWithdraw(token1, 100);
        _assertReentrantError(success, errorBytes);
    }

    function test_reentrantWithdrawToAndCallReverts() external {
        (bool success, bytes memory errorBytes) = staking.reentrantWithdrawToAndCall(
            token1,
            IStakingReceiver(alice),
            100,
            ""
        );
        _assertReentrantError(success, errorBytes);
    }

    function test_reentrantEmergencyWithdrawReverts() external {
        (bool success, bytes memory errorBytes) = staking.reentrantEmergencyWithdraw(token1);
        _assertReentrantError(success, errorBytes);
    }

    function test_reentrantClaimReverts() external {
        IERC20[] memory tokens = new IERC20[](1);
        tokens[0] = token1;
        (bool success, bytes memory errorBytes) = staking.reentrantClaim(tokens);
        _assertReentrantError(success, errorBytes);
    }
}

contract StargateStakingMock is StargateStaking {
    function reentrantDeposit(
        IERC20 _token,
        uint256 _amount
    ) external nonReentrant returns (bool success, bytes memory data) {
        // external call to deposit requires delegatecall to maintain msg.sender
        // first argument for encodeWithSignature(...) must be address, not IERC20
        (success, data) = address(this).delegatecall(
            abi.encodeWithSignature("deposit(address,uint256)", _token, _amount)
        );
    }

    function reentrantDepositTo(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external nonReentrant returns (bool success, bytes memory data) {
        (success, data) = address(this).delegatecall(
            abi.encodeWithSignature("depositTo(address,address,uint256)", _token, _to, _amount)
        );
    }

    function reentrantWithdraw(
        IERC20 token,
        uint256 amount
    ) external nonReentrant returns (bool success, bytes memory data) {
        (success, data) = address(this).delegatecall(
            abi.encodeWithSignature("withdraw(address,uint256)", token, amount)
        );
    }

    function reentrantWithdrawToAndCall(
        IERC20 token,
        IStakingReceiver to,
        uint256 amount,
        bytes calldata inputData
    ) external nonReentrant returns (bool success, bytes memory data) {
        (success, data) = address(this).delegatecall(
            abi.encodeWithSignature("withdrawToAndCall(address,address,uint256,bytes)", token, to, amount, inputData)
        );
    }

    function reentrantEmergencyWithdraw(IERC20 token) external nonReentrant returns (bool success, bytes memory data) {
        (success, data) = address(this).delegatecall(abi.encodeWithSignature("emergencyWithdraw(address)", token));
    }

    function reentrantClaim(IERC20[] calldata tokens) external nonReentrant returns (bool success, bytes memory data) {
        (success, data) = address(this).delegatecall(abi.encodeWithSignature("claim(address[])", tokens));
    }
}

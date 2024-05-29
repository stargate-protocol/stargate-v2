// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import { Transfer } from "../../../src/libs/Transfer.sol";

import { ExpensiveReceiver } from "../../utils/ExpensiveReceiver.sol";
import { ERC20Token } from "../../../src/mocks/ERC20Token.sol";

contract TransferTest is Transfer, Test {
    address public constant receiver = address(0x1234);
    address private expensiveReceiver;
    ERC20Token private token;

    function setUp() public {
        expensiveReceiver = address(new ExpensiveReceiver());
        token = new ERC20Token("Mock", "MCK", 6); // we start with 1000 token minted
    }

    function test_transferNative_unlimited_success() public {
        uint256 beforeBalance = receiver.balance;
        bool result = Transfer.transferNative(receiver, 1 ether, false);
        uint256 afterBalance = receiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
        assertEq(result, true);
    }

    function test_transferNative_limited_success() public {
        uint256 beforeBalance = receiver.balance;
        bool result = Transfer.transferNative(receiver, 1 ether, true);
        uint256 afterBalance = receiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
        assertEq(result, true);
    }

    function test_transferNative_unlimited_expensive_success() public {
        uint256 beforeBalance = expensiveReceiver.balance;
        bool result = Transfer.transferNative(expensiveReceiver, 1 ether, false);
        uint256 afterBalance = expensiveReceiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
        assertEq(result, true);
    }

    function test_transferNative_limited_expensive_failure_notEnoughGas() public {
        uint256 beforeBalance = expensiveReceiver.balance;
        bool result = Transfer.transferNative(expensiveReceiver, 1 ether, true);
        uint256 afterBalance = expensiveReceiver.balance;

        assertEq(afterBalance, beforeBalance);
        assertEq(result, false);
    }

    function test_transferToken_success() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        bool result = Transfer.transferToken(address(token), receiver, 1);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance + 1);
        assertEq(result, true);
    }

    function test_transferToken_failure_notEnoughToken() public {
        uint256 beforeBalance = token.balanceOf(address(this));
        vm.prank(receiver);
        bool result = Transfer.transferToken(address(token), address(this), 1);
        uint256 afterBalance = token.balanceOf(address(this));

        assertEq(afterBalance, beforeBalance);
        assertEq(result, false);
    }

    function test_transferTokenFrom_success() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        Transfer.approveToken(address(token), address(this), 1);
        bool result = Transfer.transferTokenFrom(address(token), address(this), receiver, 1);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance + 1);
        assertEq(result, true);
    }

    function test_transferTokenFrom_failure_notApproved() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        bool result = Transfer.transferTokenFrom(address(token), address(this), receiver, 1);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance);
        assertEq(result, false);
    }

    function test_transferTokenFrom_failure_notEnoughTokens() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        vm.prank(receiver);
        Transfer.approveToken(address(token), address(this), 1);
        bool result = Transfer.transferTokenFrom(address(token), receiver, address(this), 1);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance);
        assertEq(result, false);
    }

    function test_transfer_native_unlimited_success() public {
        uint256 beforeBalance = receiver.balance;
        bool result = Transfer.transfer(address(0x0), receiver, 1 ether, false);
        uint256 afterBalance = receiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
        assertEq(result, true);
    }

    function test_transfer_native_limited_success() public {
        uint256 beforeBalance = receiver.balance;
        bool result = Transfer.transfer(address(0x0), receiver, 1 ether, false);
        uint256 afterBalance = receiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
        assertEq(result, true);
    }

    function test_transfer_native_limited_failure_notEnoughGas() public {
        uint256 beforeBalance = expensiveReceiver.balance;
        bool result = Transfer.transfer(address(0x0), expensiveReceiver, 1 ether, true);
        uint256 afterBalance = expensiveReceiver.balance;

        assertEq(afterBalance, beforeBalance);
        assertEq(result, false);
    }

    function test_transfer_token_unlimited_success() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        bool result = Transfer.transfer(address(token), receiver, 1, false);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance + 1);
        assertEq(result, true);
    }

    function test_transfer_token_limited_success() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        bool result = Transfer.transfer(address(token), receiver, 1, true);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance + 1);
        assertEq(result, true);
    }

    function test_transfer_token_unlimited_failure_notEnoughTokens() public {
        uint256 beforeBalance = token.balanceOf(address(this));
        vm.prank(receiver);
        bool result = Transfer.transfer(address(token), address(this), 1, false);
        uint256 afterBalance = token.balanceOf(address(this));

        assertEq(afterBalance, beforeBalance);
        assertEq(result, false);
    }

    function test_approveToken_success() public {
        bool result = Transfer.approveToken(address(token), receiver, 1);
        uint256 allowance = token.allowance(address(this), receiver);

        assertEq(allowance, 1);
        assertEq(result, true);
    }

    function test_safeTransferNative_unlimited_success() public {
        uint256 beforeBalance = receiver.balance;
        Transfer.safeTransferNative(receiver, 1 ether, false);
        uint256 afterBalance = receiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
    }

    function testFail_safeTransferNative_unlimited_failure_notEnoughFunds() public {
        vm.prank(receiver);
        Transfer.safeTransferNative(address(this), 1 ether, false);
    }

    function test_safeTransferNative_limited_success() public {
        uint256 beforeBalance = receiver.balance;
        Transfer.safeTransferNative(receiver, 1 ether, true);
        uint256 afterBalance = receiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
    }

    function testFail_safeTransferNative_limited_failure_notEnoughGas() public {
        Transfer.safeTransferNative(expensiveReceiver, 1 ether, true);
    }

    function testFail_safeTransferNative_limited_failure_notEnoughFunds() public {
        vm.prank(receiver);
        Transfer.safeTransferNative(address(this), 1 ether, true);
    }

    function test_safeTransferToken_success() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        Transfer.safeTransferToken(address(token), receiver, 1);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance + 1);
    }

    function testFail_safeTransferToken_failure_notEnoughToken() public {
        vm.prank(receiver);
        Transfer.safeTransferToken(address(token), address(this), 1);
    }

    function test_safeTransferTokenFrom_success() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        Transfer.approveToken(address(token), address(this), 1);
        Transfer.safeTransferTokenFrom(address(token), address(this), receiver, 1);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance + 1);
    }

    function testFail_safeTransferTokenFrom_failure_notEnoughTokens() public {
        vm.prank(receiver);
        Transfer.approveToken(address(token), address(this), 1);
        Transfer.safeTransferTokenFrom(address(token), receiver, address(this), 1);
    }

    function test_safeApproveToken_success() public {
        Transfer.safeApproveToken(address(token), receiver, 1);
        uint256 allowance = token.allowance(address(this), receiver);

        assertEq(allowance, 1);
    }

    function testFail_safeApproveToken_failure() public {
        Transfer.safeApproveToken(address(token), address(0x0), 1);
    }

    function test_safeTransfer_native_unlimited_success() public {
        uint256 beforeBalance = receiver.balance;
        Transfer.safeTransfer(address(0x0), receiver, 1 ether, false);
        uint256 afterBalance = receiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
    }

    function test_safeTransfer_native_limited_success() public {
        uint256 beforeBalance = receiver.balance;
        Transfer.safeTransfer(address(0x0), receiver, 1 ether, false);
        uint256 afterBalance = receiver.balance;

        assertEq(afterBalance, beforeBalance + 1 ether);
    }

    function testFail_safeTransfer_native_limited_failure_notEnoughGas() public {
        Transfer.safeTransfer(address(0x0), expensiveReceiver, 1 ether, true);
    }

    function test_safeTransfer_token_unlimited_success() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        Transfer.safeTransfer(address(token), receiver, 1, false);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance + 1);
    }

    function test_safeTransfer_token_limited_success() public {
        uint256 beforeBalance = token.balanceOf(receiver);
        Transfer.safeTransfer(address(token), receiver, 1, true);
        uint256 afterBalance = token.balanceOf(receiver);

        assertEq(afterBalance, beforeBalance + 1);
    }

    function testFail_safeTransfer_token_unlimited_failure_notEnoughTokens() public {
        vm.prank(receiver);
        Transfer.safeTransfer(address(token), receiver, 1, false);
    }

    function testFail_forcedApproveToken() public {
        Transfer.safeApproveToken(address(token), receiver, 1);
        uint256 allowance = token.allowance(address(this), receiver);
        assertEq(allowance, 1);

        vm.expectRevert(Transfer.Transfer_ApproveFailed.selector);
        Transfer.safeApproveToken(address(token), receiver, 10);
    }

    function test_forcedApproveToken_success() public {
        Transfer.safeApproveToken(address(token), receiver, 1);
        uint256 allowance = token.allowance(address(this), receiver);
        assertEq(allowance, 1);

        Transfer.forceApproveToken(address(token), receiver, 10);
        allowance = token.allowance(address(this), receiver);
        assertEq(allowance, 10);
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { BalanceUtils, Result } from "../../../src/utils/BalanceUtils.sol";
import { ERC20Token } from "../../../src/mocks/ERC20Token.sol";
import { Test } from "forge-std/Test.sol";

contract BalanceUtilsTest is Test {
    BalanceUtils public balanceUtils;
    ERC20Token public validToken;
    NonERC20 public invalidToken;
    address public user;

    function setUp() public {
        balanceUtils = new BalanceUtils();
        validToken = new ERC20Token("Valid Token", "VALID", 18);
        invalidToken = new NonERC20();
        user = address(0xBEEF);

        // Mint some tokens to the user
        validToken.mint(user, 1000 ether);

        // Give some ETH to the user
        vm.deal(user, 2 ether);
    }

    function testGetBalanceValidToken() public {
        Result memory result = balanceUtils.getBalance(user, address(validToken));
        assertTrue(result.success);
        assertEq(result.balance, 1000 ether);
    }

    function testGetBalanceInvalidToken() public {
        Result memory result = balanceUtils.getBalance(user, address(invalidToken));
        assertTrue(result.success == false);
        assertEq(result.balance, 0);
    }

    function testGetBalanceNonExistentToken() public {
        Result memory result = balanceUtils.getBalance(user, address(0x123));
        assertTrue(result.success == false);
        assertEq(result.balance, 0);
    }

    function testGetBalances() public {
        address[] memory tokens = new address[](3);
        tokens[0] = address(validToken);
        tokens[1] = address(invalidToken);
        tokens[2] = address(0x123);

        Result[] memory results = balanceUtils.getBalances(user, tokens);

        // First token should return success and correct balance
        assertTrue(results[0].success);
        assertEq(results[0].balance, 1000 ether);

        // Second token should return failure (not an ERC20 token)
        assertTrue(results[1].success == false);
        assertEq(results[1].balance, 0);

        // Third token should return failure (not a contract)
        assertTrue(results[2].success == false);
        assertEq(results[2].balance, 0);

        // Last element should be ETH balance
        assertTrue(results[3].success);
        assertEq(results[3].balance, 2 ether);
    }

    function testGetBalancesEmptyArray() public {
        address[] memory tokens = new address[](0);
        Result[] memory results = balanceUtils.getBalances(user, tokens);

        // Only ETH balance should be returned
        assertEq(results.length, 1);
        assertTrue(results[0].success);
        assertEq(results[0].balance, 2 ether);
    }
}

contract NonERC20 {}

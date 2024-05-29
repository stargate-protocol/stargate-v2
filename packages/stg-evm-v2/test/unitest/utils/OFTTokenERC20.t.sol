// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { OFTTokenERC20 } from "../../../src/utils/OFTTokenERC20.sol";

contract OFTTokenERC20Test is Test {
    address constant ALICE = address(0xace);
    OFTTokenERC20 public token;

    string internal constant USDT_NAME = "USD Tether";
    string internal constant USDT_SYMBOL = "USDT";
    uint8 internal constant USDT_DECIMALS = 6;

    function createOFTTokenERC20() internal returns (OFTTokenERC20) {
        return new OFTTokenERC20(USDT_NAME, USDT_SYMBOL, USDT_DECIMALS);
    }

    function setUp() public {
        token = createOFTTokenERC20();
    }

    function test_constructor(uint8 _decimals) public {
        OFTTokenERC20 token = new OFTTokenERC20(USDT_NAME, USDT_SYMBOL, _decimals);
        assertEq(token.name(), USDT_NAME);
        assertEq(token.symbol(), USDT_SYMBOL);
        assertEq(token.decimals(), _decimals);
    }

    function test_addMinter_ownerCanCall() public {
        token.addMinter(ALICE);
    }

    function testFail_addMinter_othersCanNotCall() public {
        vm.prank(ALICE);
        token.addMinter(ALICE);
    }

    function test_addMinter_addsMinter() public {
        assertFalse(token.minters(ALICE));

        token.addMinter(ALICE);

        assertTrue(token.minters(ALICE));
    }

    function test_addMinter_mintersAreIndependent() public {
        assertFalse(token.minters(ALICE));
        assertFalse(token.minters(address(this)));

        token.addMinter(ALICE);

        assertTrue(token.minters(ALICE));
        assertFalse(token.minters(address(this)));
    }

    function test_removeMinter_ownerCanCall() public {
        token.removeMinter(ALICE);
    }

    function testFail_removeMinter_othersCanNotCall() public {
        vm.prank(ALICE);
        token.removeMinter(ALICE);
    }

    function test_removeMinter_removesMinter() public {
        token.addMinter(ALICE);
        assertTrue(token.minters(ALICE));

        token.removeMinter(ALICE);

        assertFalse(token.minters(ALICE));
    }

    function test_removeMinter_mintersAreIndependent() public {
        token.addMinter(ALICE);
        token.addMinter(address(this));
        assertTrue(token.minters(ALICE));
        assertTrue(token.minters(address(this)));

        token.removeMinter(ALICE);

        assertFalse(token.minters(ALICE));
        assertTrue(token.minters(address(this)));
    }

    function test_mint_mints() public {
        token.addMinter(ALICE);
        uint256 amount = 100;
        uint256 totalSupplyBefore = token.totalSupply();
        uint256 balanceBefore = token.balanceOf(ALICE);

        vm.prank(ALICE);
        token.mint(ALICE, amount);

        uint256 totalSupplyAfter = token.totalSupply();
        uint256 balanceAfter = token.balanceOf(ALICE);

        assertEq(totalSupplyAfter, totalSupplyBefore + amount);
        assertEq(balanceAfter, balanceBefore + amount);
    }

    function test_mint_minterCanMint() public {
        token.addMinter(ALICE);
        uint256 amount = 100;

        vm.prank(ALICE);
        token.mint(ALICE, amount);
    }

    function testFail_mint_othersCanNotMint() public {
        uint256 amount = 100;

        vm.prank(ALICE);
        token.mint(ALICE, amount);
    }

    function test_burnFrom_burnsFrom() public {
        token.addMinter(ALICE);
        uint256 amount = 100;
        vm.prank(ALICE);
        token.mint(ALICE, amount);
        uint256 totalSupplyBefore = token.totalSupply();
        uint256 balanceBefore = token.balanceOf(ALICE);
        vm.prank(ALICE);
        token.approve(ALICE, amount);

        vm.prank(ALICE);
        token.burnFrom(ALICE, amount);

        uint256 totalSupplyAfter = token.totalSupply();
        uint256 balanceAfter = token.balanceOf(ALICE);

        assertEq(totalSupplyAfter, totalSupplyBefore - amount);
        assertEq(balanceAfter, balanceBefore - amount);
    }

    function test_burnFrom_minterCanBurn() public {
        token.addMinter(ALICE);
        uint256 amount = 100;
        vm.prank(ALICE);
        token.mint(ALICE, amount);
        vm.prank(ALICE);
        token.approve(ALICE, amount);

        vm.prank(ALICE);
        token.burnFrom(ALICE, amount);
    }

    function testFail_burnFrom_othersCanNotBurn() public {
        uint256 amount = 100;

        vm.prank(ALICE);
        token.burnFrom(ALICE, amount);
    }
}

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import { OFTTokenERC20Upgradeable } from "../../../src/utils/OFTTokenERC20Upgradeable.sol";

contract OFTTokenERC20UpgradeableTest is Test {
    address internal constant ALICE = address(0xace);

    string internal constant USDT_NAME = "USD Tether";
    string internal constant USDT_SYMBOL = "USDT";
    uint8 internal constant USDT_DECIMALS = 6;

    OFTTokenERC20Upgradeable public token;

    function createOFTTokenERC20Upgradeable() internal returns (OFTTokenERC20Upgradeable) {
        OFTTokenERC20Upgradeable token = new OFTTokenERC20Upgradeable();
        token.initialize(USDT_NAME, USDT_SYMBOL, USDT_DECIMALS);
        return token;
    }

    function setUp() public {
        token = createOFTTokenERC20Upgradeable();
    }

    function test_constructor(uint8 _decimals) public {
        OFTTokenERC20Upgradeable token = new OFTTokenERC20Upgradeable();
        token.initialize(USDT_NAME, USDT_SYMBOL, _decimals);
        assertEq(token.name(), USDT_NAME);
        assertEq(token.symbol(), USDT_SYMBOL);
        assertEq(token.decimals(), _decimals);
    }

    /// @notice Test that ALICE can be added as a minter
    function addAliceExpectMinterAdded() public {
        vm.expectEmit();
        emit OFTTokenERC20Upgradeable.MinterAdded(ALICE);
        token.addMinter(ALICE);
    }

    /// @notice Test that ALICE can be removed as a minter
    function removeAliceExpectMinterRemoved() public {
        vm.expectEmit();
        emit OFTTokenERC20Upgradeable.MinterRemoved(ALICE);
        token.removeMinter(ALICE);
    }

    function test_addMinter_ownerCanCall() public {
        addAliceExpectMinterAdded();
    }

    function testFail_addMinter_othersCanNotCall() public {
        vm.prank(ALICE);
        token.addMinter(ALICE);
    }

    function test_addMinter_addsMinter() public {
        assertFalse(token.minters(ALICE));

        addAliceExpectMinterAdded();

        assertTrue(token.minters(ALICE));
    }

    function test_addMinter_mintersAreIndependent() public {
        assertFalse(token.minters(ALICE));
        assertFalse(token.minters(address(this)));

        addAliceExpectMinterAdded();

        assertTrue(token.minters(ALICE));
        assertFalse(token.minters(address(this)));
    }

    function test_removeMinter_ownerCanCall() public {
        vm.expectEmit();
        emit OFTTokenERC20Upgradeable.MinterRemoved(ALICE);
        token.removeMinter(ALICE);
    }

    function testFail_removeMinter_othersCanNotCall() public {
        vm.prank(ALICE);
        token.removeMinter(ALICE);
    }

    function test_removeMinter_removesMinter() public {
        token.addMinter(ALICE);
        assertTrue(token.minters(ALICE));

        removeAliceExpectMinterRemoved();

        assertFalse(token.minters(ALICE));
    }

    function test_removeMinter_mintersAreIndependent() public {
        token.addMinter(ALICE);
        token.addMinter(address(this));
        assertTrue(token.minters(ALICE));
        assertTrue(token.minters(address(this)));

        removeAliceExpectMinterRemoved();

        assertFalse(token.minters(ALICE));
        assertTrue(token.minters(address(this)));
    }

    function test_mint_mints(uint256 _amount) public {
        token.addMinter(ALICE);
        uint256 totalSupplyBefore = token.totalSupply();
        uint256 balanceBefore = token.balanceOf(ALICE);

        vm.prank(ALICE);
        token.mint(ALICE, _amount);

        uint256 totalSupplyAfter = token.totalSupply();
        uint256 balanceAfter = token.balanceOf(ALICE);

        assertEq(totalSupplyAfter, totalSupplyBefore + _amount);
        assertEq(balanceAfter, balanceBefore + _amount);
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

    function test_burnFrom_burnsFrom(uint256 _amount) public {
        token.addMinter(ALICE);
        vm.prank(ALICE);
        token.mint(ALICE, _amount);
        uint256 totalSupplyBefore = token.totalSupply();
        uint256 balanceBefore = token.balanceOf(ALICE);
        vm.prank(ALICE);
        token.approve(ALICE, _amount);

        vm.prank(ALICE);
        token.burnFrom(ALICE, _amount);

        uint256 totalSupplyAfter = token.totalSupply();
        uint256 balanceAfter = token.balanceOf(ALICE);

        assertEq(totalSupplyAfter, totalSupplyBefore - _amount);
        assertEq(balanceAfter, balanceBefore - _amount);
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

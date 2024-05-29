// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { Treasurer, Transfer } from "../../../src/peripheral/Treasurer.sol";
import { ERC20Token } from "../../../src/mocks/ERC20Token.sol";
import { StargateBase, FeeParams } from "../../../src/StargateBase.sol";
import { StargateType, IOFT } from "../../../src/interfaces/IStargate.sol";

contract TreasurerTest is Test, Treasurer {
    bytes public constant NOT_OWNER_ERROR = "Ownable: caller is not the owner";
    address public constant NON_OWNER = address(0x1);
    address public constant STARGATE = address(0x2);
    address public constant OWNER = address(0x3);
    address public constant ADMIN = address(0x4);
    ERC20Token public MOCK_ERC20;

    constructor() Treasurer(OWNER, ADMIN) {}

    function setUp() public {
        admin = ADMIN;
        // create a mock ERC20 token, mint 10000 tokens to the owner
        MOCK_ERC20 = new ERC20Token("Mock", "MCK", 6);
    }

    function test_setAdmin() public {
        address newAdmin = address(0x5);
        vm.prank(OWNER);
        this.setAdmin(newAdmin);
        assertEq(admin, newAdmin);
    }

    function test_RevertIf_SetAdminByNonOwner() public {
        vm.expectRevert(NOT_OWNER_ERROR);
        vm.prank(NON_OWNER);
        this.setAdmin(address(0x5));
    }

    function test_setStargate() public {
        vm.prank(OWNER);
        this.setStargate(STARGATE, true);
        assert(stargates[STARGATE]);

        vm.prank(OWNER);
        this.setStargate(STARGATE, false);
        assert(!stargates[STARGATE]);
    }

    function test_RevertIf_SetStargateByNonOwner() public {
        vm.expectRevert(NOT_OWNER_ERROR);
        vm.prank(NON_OWNER);
        this.setStargate(STARGATE, true);
    }

    function test_transfer() public {
        assertEq(MOCK_ERC20.balanceOf(NON_OWNER), 0);
        vm.prank(OWNER);
        this.transfer(address(MOCK_ERC20), NON_OWNER, 100);
        assertEq(MOCK_ERC20.balanceOf(NON_OWNER), 100);
    }

    function test_transferNative() public {
        assertEq(NON_OWNER.balance, 0);
        vm.prank(OWNER);
        this.transfer(address(0x0), NON_OWNER, 100);
        assertEq(NON_OWNER.balance, 100);
    }

    function test_RevertIf_TransferByNonOwner() public {
        vm.expectRevert(NOT_OWNER_ERROR);
        vm.prank(NON_OWNER);
        this.transfer(address(MOCK_ERC20), NON_OWNER, 100);
    }

    function test_RevertIf_TransferTooMuch() public {
        vm.expectRevert(Transfer.Transfer_TransferFailed.selector);
        vm.prank(OWNER);
        this.transfer(address(MOCK_ERC20), NON_OWNER, 10001 ether);
    }

    function test_withdrawTreasuryFee() public {
        uint64 mockTreasuryFeeSD = 100;
        _mockStargateWithdrawTreasuryFee(mockTreasuryFeeSD);
        vm.prank(OWNER);
        this.setStargate(STARGATE, true);
        vm.prank(ADMIN);
        vm.expectCall(
            STARGATE,
            abi.encodeWithSelector(StargateBase.withdrawTreasuryFee.selector, address(this), mockTreasuryFeeSD),
            1
        );
        this.withdrawTreasuryFee(STARGATE, mockTreasuryFeeSD);
    }

    function test_RevertIf_WithdrawTreasuryFeeByNonAdmin() public {
        uint64 mockTreasuryFeeSD = 100;
        _mockStargateWithdrawTreasuryFee(mockTreasuryFeeSD);
        vm.prank(OWNER);
        this.setStargate(STARGATE, true);
        vm.expectRevert(Treasurer.Unauthorized.selector);
        this.withdrawTreasuryFee(STARGATE, mockTreasuryFeeSD);
    }

    function test_RevertIf_WithdrawTreasuryFeeByNonStargate() public {
        uint64 mockTreasuryFeeSD = 100;
        _mockStargateWithdrawTreasuryFee(mockTreasuryFeeSD);
        vm.prank(OWNER);
        this.setStargate(STARGATE, false);
        vm.prank(ADMIN);
        vm.expectRevert(Treasurer.Unauthorized.selector);
        this.withdrawTreasuryFee(STARGATE, mockTreasuryFeeSD);
    }

    function test_addTreasuryFee() public {
        uint256 mockTreasuryFee = 100;
        _mockStargateToken(address(MOCK_ERC20));
        _mockStargateAddTreasuryFee(mockTreasuryFee, 0);
        vm.prank(OWNER);
        this.setStargate(STARGATE, true);
        vm.prank(ADMIN);
        vm.expectCall(STARGATE, 0, abi.encodeWithSelector(StargateBase.addTreasuryFee.selector, mockTreasuryFee), 1);
        this.addTreasuryFee(STARGATE, mockTreasuryFee);
        assertEq(MOCK_ERC20.allowance(address(this), STARGATE), mockTreasuryFee);
    }

    function test_addTreasuryFeeToNative() public {
        uint256 mockTreasuryFee = 100;
        _mockStargateToken(address(0x0));
        _mockStargateAddTreasuryFee(mockTreasuryFee, mockTreasuryFee);
        vm.prank(OWNER);
        this.setStargate(STARGATE, true);
        vm.prank(ADMIN);
        vm.expectCall(
            STARGATE,
            mockTreasuryFee,
            abi.encodeWithSelector(StargateBase.addTreasuryFee.selector, mockTreasuryFee),
            1
        );
        this.addTreasuryFee(STARGATE, mockTreasuryFee);
    }

    function test_RevertIf_AddTreasuryFeeByNonAdmin() public {
        _mockStargateToken(address(MOCK_ERC20));
        _mockStargateAddTreasuryFee(100, 0);
        vm.prank(OWNER);
        this.setStargate(STARGATE, true);
        vm.expectRevert(Treasurer.Unauthorized.selector);
        this.addTreasuryFee(STARGATE, 100);
    }

    function test_RevertIf_AddTreasuryFeeByNonStargate() public {
        _mockStargateToken(address(MOCK_ERC20));
        _mockStargateAddTreasuryFee(100, 0);
        vm.prank(OWNER);
        this.setStargate(STARGATE, false);
        vm.prank(ADMIN);
        vm.expectRevert(Treasurer.Unauthorized.selector);
        this.addTreasuryFee(STARGATE, 100);
    }

    function _mockStargateWithdrawTreasuryFee(uint64 _amountSD) internal {
        vm.mockCall(
            STARGATE,
            abi.encodeWithSelector(StargateBase.withdrawTreasuryFee.selector, address(this), _amountSD),
            ""
        );
    }

    function _mockStargateAddTreasuryFee(uint256 _amountLD, uint256 _value) internal {
        console.logBytes(abi.encodeWithSelector(StargateBase.addTreasuryFee.selector, _amountLD));
        vm.mockCall(STARGATE, _value, abi.encodeWithSelector(StargateBase.addTreasuryFee.selector, _amountLD), "");
    }

    function _mockStargateToken(address _token) internal {
        vm.mockCall(STARGATE, abi.encodeWithSelector(IOFT.token.selector), abi.encode(_token));
    }
}

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { console } from "forge-std/Test.sol";

import { PathLib } from "../../../src/libs/Path.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { StargateBaseTestC, StargateBaseTestHelper } from "../helper/StargateBaseTestHelper.sol";
import { TokenMessaging } from "../../../src/messaging/TokenMessaging.sol";

contract StargateBaseTest is StargateBaseTestHelper {
    address internal constant ETH_TOKEN_ADDRESS = address(0);

    // ---- test setXXX, only owner -----

    function test_SetAddressConfig() public {
        uint256 pk = 1;
        address newFeeLib = vm.addr(pk++);
        address newPlanner = vm.addr(pk++);
        address newTreasurer = vm.addr(pk++);
        address newTokenMessaging = vm.addr(pk++);
        address newCreditMessaging = vm.addr(pk++);
        address newLzToken = vm.addr(pk++);
        StargateBase.AddressConfig memory newAddressConfig = StargateBase.AddressConfig({
            feeLib: newFeeLib,
            planner: newPlanner,
            treasurer: newTreasurer,
            tokenMessaging: newTokenMessaging,
            creditMessaging: newCreditMessaging,
            lzToken: newLzToken
        });

        // owner can set fee library
        vm.expectEmit();
        emit StargateBase.AddressConfigSet(newAddressConfig);
        stargate.setAddressConfig(newAddressConfig);

        StargateBase.AddressConfig memory addressConfig = stargate.getAddressConfig();
        assertEq(addressConfig.feeLib, newFeeLib);
        assertEq(addressConfig.planner, newPlanner);
        assertEq(addressConfig.treasurer, newTreasurer);
        assertEq(addressConfig.tokenMessaging, newTokenMessaging);
        assertEq(addressConfig.creditMessaging, newCreditMessaging);
        assertEq(addressConfig.lzToken, newLzToken);

        // revert if not owner
        vm.stopPrank();
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        stargate.setAddressConfig(newAddressConfig);
    }

    function test_SetOFTPath() public {
        uint32 dstEid = 2;
        bool isOft = true;
        vm.expectEmit();
        emit StargateBase.OFTPathSet(dstEid, isOft);
        stargate.setOFTPath(dstEid, isOft);
        assertEq(stargate.getCredit(dstEid), PathLib.UNLIMITED_CREDIT);

        // unset oft path
        isOft = false;
        vm.expectEmit();
        emit StargateBase.OFTPathSet(dstEid, isOft);
        stargate.setOFTPath(dstEid, isOft);
        assertEq(stargate.getCredit(dstEid), 0);

        // revert if set local as oft path
        uint32 localEid = stargate.getLocalEid();
        vm.expectRevert(StargateBase.Stargate_InvalidPath.selector);
        stargate.setOFTPath(localEid, isOft);

        // revert if not owner
        vm.stopPrank();
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        stargate.setOFTPath(dstEid, isOft);
    }

    // ---- test treasurer -----

    function test_AddTreasuryFee() public {
        uint256 amount = _sd2ld(100);
        uint64 feeBefore = stargate.treasuryFee();
        vm.expectEmit();
        emit StargateBase.TreasuryFeeAdded(100);
        vm.stopPrank();
        vm.prank(treasurer);
        stargate.addTreasuryFee(amount);
        uint64 feeAfter = stargate.treasuryFee();
        assertEq(feeAfter, feeBefore + 100);

        // revert if send with value
        vm.prank(treasurer);
        vm.deal(treasurer, 1);
        vm.expectRevert(StargateBase.Stargate_InvalidAmount.selector);
        stargate.addTreasuryFee{ value: 1 }(amount);

        // revert if not treasurer
        vm.prank(ALICE);
        vm.expectRevert(StargateBase.Stargate_Unauthorized.selector);
        stargate.addTreasuryFee(amount);
    }

    function test_WithdrawTreasuryFee() public {
        uint256 amount = _sd2ld(100);
        vm.stopPrank();
        vm.prank(treasurer);
        stargate.addTreasuryFee(amount);

        vm.expectEmit();
        emit StargateBase.TreasuryFeeWithdrawn(ALICE, 100);
        vm.prank(treasurer);
        stargate.withdrawTreasuryFee(ALICE, 100);
        assertEq(stargate.treasuryFee(), 0);

        // revert if not treasurer
        vm.prank(ALICE);
        vm.expectRevert(StargateBase.Stargate_Unauthorized.selector);
        stargate.withdrawTreasuryFee(ALICE, 100);
    }

    // ---- test Planner -----

    function test_SetPause() public {
        vm.stopPrank();
        vm.prank(planner);
        vm.expectEmit();
        emit StargateBase.PauseSet(true);
        stargate.setPause(true);
        assertEq(stargate.status(), PAUSED);

        vm.prank(planner);
        vm.expectEmit();
        emit StargateBase.PauseSet(false);
        stargate.setPause(false);
        assertEq(stargate.status(), NOT_ENTERED);

        // revert if not planner
        vm.prank(ALICE);
        vm.expectRevert(StargateBase.Stargate_Unauthorized.selector);
        stargate.setPause(true);

        // revert if reentrant
        StargateReentrancyMock mock = new StargateReentrancyMock();
        vm.prank(planner);
        (bool success, bytes memory data) = mock.reentrantSetPause(false);
        assertFalse(success);
        assertGe(data.length, 4);
        bytes4 failCode;
        assembly {
            failCode := mload(add(data, 32)) // slice off first 4 bytes
        }
        assertEq(StargateBase.Stargate_ReentrantCall.selector, failCode);
    }

    function test_RecoverToken(uint64 _amount) public {
        StargateReentrancyMock mock = new StargateReentrancyMock();
        uint256 amount = _sd2ld(_amount);
        vm.stopPrank();
        vm.prank(treasurer);
        mock.addTreasuryFee(amount);

        // 1. test reentrant call
        vm.prank(treasurer);
        vm.expectRevert(StargateBase.Stargate_ReentrantCall.selector);
        mock.reentrantRecoverToken(vm.addr(1), ALICE, _amount);

        // pause
        vm.prank(planner);
        mock.setPause(true);

        // 2. test paused call
        vm.prank(treasurer);
        vm.expectRevert(StargateBase.Stargate_Paused.selector);
        mock.reentrantRecoverToken(vm.addr(1), ALICE, _amount);

        // unpause
        vm.prank(planner);
        mock.setPause(false);

        // 3. test recovering the pool token
        address token = mock.token();
        vm.prank(treasurer);
        mock.recoverToken(token, ALICE, _amount);

        // 4. test valid call
        vm.prank(treasurer);
        assertEq(_amount, mock.recoverToken(vm.addr(1), ALICE, _amount));
    }

    function test_recoverNativeEth(address _to, uint256 _amount) public {
        // Ensure native eth cannot be recovered from StargateBase.
        // Excess native eth is assumed to belong to the PLANNER.
        vm.startPrank(treasurer);
        vm.expectRevert(StargateBase.Stargate_RecoverTokenUnsupported.selector);
        stargate.recoverToken(ETH_TOKEN_ADDRESS, _to, _amount);
        vm.stopPrank();
    }

    function test_WithdrawPlannerFee() public {
        // revert if not planner
        vm.startPrank(ALICE);
        vm.expectRevert(StargateBase.Stargate_Unauthorized.selector);
        stargate.withdrawPlannerFee();
        vm.stopPrank();

        // succeed if planner
        uint256 plannerBalance = planner.balance;
        uint256 plannerFee = stargate.plannerFee();
        vm.startPrank(planner);
        vm.expectEmit();
        emit StargateBase.PlannerFeeWithdrawn(plannerFee);
        stargate.withdrawPlannerFee();
        assertEq(planner.balance, plannerBalance + plannerFee);
        vm.stopPrank();

        // ensure plannerFee balance is now 0.
        assertEq(0, stargate.plannerFee());
    }
}

contract StargateReentrancyMock is StargateBaseTestC {
    function reentrantSetPause(bool _pause) public nonReentrantAndNotPaused returns (bool, bytes memory) {
        // external call to setPause requires delegatecall to maintain msg.sender
        return address(this).delegatecall(abi.encodeWithSignature("setPause(bool)", _pause));
    }

    function reentrantRecoverToken(
        address _token,
        address _to,
        uint256 _amount
    ) public virtual nonReentrantAndNotPaused onlyCaller(treasurer) returns (uint256) {
        return super.recoverToken(_token, _to, _amount);
    }
}

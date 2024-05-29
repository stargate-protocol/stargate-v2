// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { console } from "forge-std/Test.sol";

import { TargetCredit } from "../../../src/interfaces/ICreditMessaging.sol";
import { Credit } from "../../../src/interfaces/ICreditMessagingHandler.sol";
import { PathLib } from "../../../src/libs/Path.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { StargateBaseTestHelper } from "../helper/StargateBaseTestHelper.sol";

contract StargateBaseCreditTest is StargateBaseTestHelper {
    function test_RevertIf_SendOFTCredit() public {
        uint32 oftDstEid = 2;
        stargate.setOFTPath(oftDstEid, true);

        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit({ srcEid: oftDstEid, amount: 100, minAmount: 0 });
        vm.expectRevert(PathLib.Path_UnlimitedCredit.selector);
        vm.prank(creditMessaging);
        stargate.sendCredits(oftDstEid, credits);
    }

    function test_SendCreditNotEnough() public {
        uint32 dstEid = 2;
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit({ srcEid: localEid, amount: 100, minAmount: 0 });
        vm.prank(creditMessaging);
        Credit[] memory actualCredits = stargate.sendCredits(dstEid, credits);
        assertEq(actualCredits.length, 0);
    }

    function test_RevertIf_SendCreditPaused() public {
        // pause the contract
        vm.prank(planner);
        stargate.setPause(true);

        uint32 dstEid = 2;
        TargetCredit[] memory credits = new TargetCredit[](0);
        vm.expectRevert(StargateBase.Stargate_Paused.selector);
        vm.prank(creditMessaging);
        stargate.sendCredits(dstEid, credits);
    }

    function test_RevertIF_SendCreditByNonCreditMessaging() public {
        uint32 dstEid = 2;
        TargetCredit[] memory credits = new TargetCredit[](0);
        vm.expectRevert(StargateBase.Stargate_Unauthorized.selector);
        stargate.sendCredits(dstEid, credits);
    }

    function test_SendCredits() public {
        uint32 dstEid = 2;
        uint32 srcEidWithNoCredit = 3;
        uint32 srcEidWithCredit = 4;
        uint64 amountSD = 100; // in sd
        // increase local credit
        stargate.increaseCredit(localEid, amountSD);
        stargate.increaseCredit(srcEidWithCredit, amountSD);

        vm.prank(creditMessaging);
        TargetCredit[] memory targetCredits = new TargetCredit[](3);
        targetCredits[0] = TargetCredit({ srcEid: localEid, amount: amountSD, minAmount: 0 }); // all credit send
        targetCredits[1] = TargetCredit({ srcEid: srcEidWithNoCredit, amount: amountSD, minAmount: 10 }); // no credit send no matter what minAmount is
        targetCredits[2] = TargetCredit({ srcEid: srcEidWithCredit, amount: amountSD, minAmount: 10 }); // credit send with minAmount left
        Credit[] memory credits = new Credit[](2);
        credits[0] = Credit({ srcEid: localEid, amount: amountSD });
        credits[1] = Credit({ srcEid: srcEidWithCredit, amount: amountSD - targetCredits[2].minAmount });
        vm.expectEmit();
        emit StargateBase.CreditsSent(dstEid, credits);
        stargate.sendCredits(dstEid, targetCredits);
        assertEq(stargate.getCredit(localEid), 0);
    }

    function test_RevertIfReceiveCreditPaused() public {
        // pause the contract
        vm.prank(planner);
        stargate.setPause(true);

        uint32 srcEid = 2;
        Credit[] memory credits = new Credit[](0);
        vm.expectRevert(StargateBase.Stargate_Paused.selector);
        vm.prank(creditMessaging);
        stargate.receiveCredits(srcEid, credits);
    }

    function test_RevertIfReceiveCreditByNonCreditMessaging() public {
        uint32 srcEid = 2;
        Credit[] memory credits = new Credit[](0);
        vm.expectRevert(StargateBase.Stargate_Unauthorized.selector);
        stargate.receiveCredits(srcEid, credits);
    }

    function test_RevertIfReceiveCreditTooMuch() public {
        uint32 srcEid = 2;
        Credit[] memory credits = new Credit[](1);
        credits[0] = Credit({ srcEid: srcEid, amount: PathLib.UNLIMITED_CREDIT });
        vm.expectRevert(PathLib.Path_UnlimitedCredit.selector);
        vm.prank(creditMessaging);
        stargate.receiveCredits(srcEid, credits);
    }

    function test_ReceiveCredits() public {
        uint32 srcEid = 2;
        uint64 amountSD = 100; // in sd
        Credit[] memory credits = new Credit[](3);
        credits[0] = Credit({ srcEid: 101, amount: amountSD });
        credits[1] = Credit({ srcEid: 102, amount: amountSD });
        credits[2] = Credit({ srcEid: 103, amount: amountSD });
        vm.expectEmit();
        emit StargateBase.CreditsReceived(srcEid, credits);
        vm.prank(creditMessaging);
        stargate.receiveCredits(srcEid, credits);
        assertEq(stargate.getCredit(101), amountSD);
        assertEq(stargate.getCredit(102), amountSD);
        assertEq(stargate.getCredit(103), amountSD);
    }
}

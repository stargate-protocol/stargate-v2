// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";
import { Vm } from "forge-std/Vm.sol";
import { TargetCredit, TargetCreditBatch } from "../../../src/interfaces/ICreditMessaging.sol";
import { Credit } from "../../../src/interfaces/ICreditMessagingHandler.sol";
import { CreditMessagingRecovery } from "../../../src/messaging/CreditMessagingRecovery.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { CreditBatch } from "../../../src/libs/CreditMsgCodec.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { StargateBaseTestC } from "../../unitest/helper/StargateBaseTestHelper.sol";

/// @notice Integration tests for CreditMessagingRecovery with a real StargateBase pool.
///         Unlike the unit tests in Messaging.CreditRecovery.t.sol (which mock the handler),
///         these tests verify that paths[eid].credit actually changes after mintCredits/burnCredits,
///         and that no LZ endpoint interaction occurs in either direction.
contract CreditMessagingRecoveryIntegrationTest is Test {
    address internal immutable OWNER = address(this);
    uint16 internal constant ASSET_ID = 1;
    uint32 internal constant SRC_EID = 10;
    string internal constant MINT_REASON = "restoring lost credits";
    string internal constant BURN_REASON = "correcting over-minted credits";

    CreditMessagingRecovery internal recoveryMessaging;
    StargateBaseTestC internal pool;

    function setUp() public {
        pool = new StargateBaseTestC();
        recoveryMessaging = new CreditMessagingRecovery(LzUtil.deployEndpointV2(2, OWNER), OWNER);

        pool.setAddressConfig(
            StargateBase.AddressConfig({
                feeLib: address(0),
                planner: address(0),
                treasurer: address(0),
                tokenMessaging: address(0),
                creditMessaging: address(recoveryMessaging),
                lzToken: address(0)
            })
        );

        recoveryMessaging.setAssetId(address(pool), ASSET_ID);
    }

    // ---------------------------------- mintCredits ------------------------------------------

    function test_MintCredits_IncreasesPoolCredit(uint64 _amount) public {
        // type(uint64).max is UNLIMITED_CREDIT sentinel — increaseCredit reverts if credit reaches it
        _amount = uint64(bound(_amount, 1, type(uint64).max - 1));

        assertEq(pool.getCredit(SRC_EID), 0);

        Credit[] memory credits = new Credit[](1);
        credits[0] = Credit({ srcEid: SRC_EID, amount: _amount });
        CreditBatch[] memory batches = new CreditBatch[](1);
        batches[0] = CreditBatch(ASSET_ID, credits);

        vm.recordLogs();
        recoveryMessaging.mintCredits(batches, MINT_REASON);
        _assertNoLzEndpointActivity();

        assertEq(pool.getCredit(SRC_EID), _amount);
    }

    function test_MintCredits_AccumulatesOnMultipleCalls(uint64 _firstAmount, uint64 _secondAmount) public {
        _firstAmount = uint64(bound(_firstAmount, 1, type(uint64).max / 2));
        _secondAmount = uint64(bound(_secondAmount, 1, type(uint64).max / 2));

        Credit[] memory credits = new Credit[](1);
        CreditBatch[] memory batches = new CreditBatch[](1);

        credits[0] = Credit({ srcEid: SRC_EID, amount: _firstAmount });
        batches[0] = CreditBatch(ASSET_ID, credits);

        vm.recordLogs();
        recoveryMessaging.mintCredits(batches, MINT_REASON);
        _assertNoLzEndpointActivity();

        credits[0] = Credit({ srcEid: SRC_EID, amount: _secondAmount });
        batches[0] = CreditBatch(ASSET_ID, credits);

        vm.recordLogs();
        recoveryMessaging.mintCredits(batches, MINT_REASON);
        _assertNoLzEndpointActivity();

        assertEq(pool.getCredit(SRC_EID), _firstAmount + _secondAmount);
    }

    // ---------------------------------- burnCredits ------------------------------------------

    function test_BurnCredits_DecreasesPoolCredit(uint64 _initialCredit, uint64 _burnAmount) public {
        // type(uint64).max is UNLIMITED_CREDIT sentinel — increaseCredit reverts if credit reaches it
        _initialCredit = uint64(bound(_initialCredit, 2, type(uint64).max - 1));
        // burn less than initial so there is credit to decrease
        _burnAmount = uint64(bound(_burnAmount, 1, _initialCredit - 1));

        pool.increaseCredit(SRC_EID, _initialCredit);
        assertEq(pool.getCredit(SRC_EID), _initialCredit);

        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit({ srcEid: SRC_EID, amount: _burnAmount, minAmount: 0 });
        TargetCreditBatch[] memory batches = new TargetCreditBatch[](1);
        batches[0] = TargetCreditBatch(ASSET_ID, credits);

        vm.recordLogs();
        recoveryMessaging.burnCredits(batches, BURN_REASON);
        _assertNoLzEndpointActivity();

        assertEq(pool.getCredit(SRC_EID), _initialCredit - _burnAmount);
    }

    function test_BurnCredits_DoesNotChangeCredit_WhenCreditIsBelowMinAmount(uint64 _credit) public {
        _credit = uint64(bound(_credit, 1, type(uint64).max - 1));

        pool.increaseCredit(SRC_EID, _credit);

        // minAmount >= currentCredit: tryDecreaseCredit returns 0 without changing state
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit({ srcEid: SRC_EID, amount: _credit, minAmount: _credit });
        TargetCreditBatch[] memory batches = new TargetCreditBatch[](1);
        batches[0] = TargetCreditBatch(ASSET_ID, credits);

        vm.recordLogs();
        recoveryMessaging.burnCredits(batches, BURN_REASON);
        _assertNoLzEndpointActivity();

        assertEq(pool.getCredit(SRC_EID), _credit);
    }

    // ---------------------------------- Helpers ------------------------------------------

    /// @dev Asserts that the LZ endpoint emitted no events, which proves no send, receive,
    ///      or any other endpoint interaction occurred during the operation.
    function _assertNoLzEndpointActivity() internal {
        address endpoint = address(recoveryMessaging.endpoint());
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i = 0; i < logs.length; i++) {
            assertNotEq(logs[i].emitter, endpoint, "unexpected event emitted by LZ endpoint");
        }
    }
}

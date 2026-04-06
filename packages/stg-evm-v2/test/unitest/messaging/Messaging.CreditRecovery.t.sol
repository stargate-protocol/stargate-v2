// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { TargetCredit, TargetCreditBatch } from "../../../src/interfaces/ICreditMessaging.sol";
import { ICreditMessagingHandler, Credit } from "../../../src/interfaces/ICreditMessagingHandler.sol";
import { CreditMessagingRecovery } from "../../../src/messaging/CreditMessagingRecovery.sol";
import { ICreditMessagingRecovery } from "../../../src/interfaces/ICreditMessagingRecovery.sol";
import { CreditMessaging, MessagingBase } from "../../../src/messaging/CreditMessaging.sol";
import { CreditBatch } from "../../../src/libs/CreditMsgCodec.sol";
import { Vm } from "forge-std/Vm.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { CreditMessagingTest } from "./Messaging.Credit.t.sol";

contract CreditMessagingRecoveryTest is CreditMessagingTest {
    address internal immutable OWNER = address(this);
    uint16 internal constant ASSET_ID = 1;
    uint32 internal constant DST_EID = 7;
    bytes internal constant OWNABLE_ERROR = "Ownable: caller is not the owner";
    string internal constant MINT_REASON = "restoring lost credits";
    string internal constant BURN_REASON = "correcting over-minted credits";

    function setUp() public override {
        CreditMessagingRecovery recoveryMessaging = new CreditMessagingRecovery(
            LzUtil.deployEndpointV2(1, OWNER),
            OWNER
        );
        recoveryMessaging.setPlanner(PLANNER);
        messaging = recoveryMessaging;
    }

    // ---------------------------------- mintCredits ------------------------------------------

    function test_RevertIf_MintCredits_EmptyReason() public {
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        CreditBatch[] memory batches = _buildMintBatches(1, 100);
        vm.expectRevert(ICreditMessagingRecovery.CreditMessagingRecovery_EmptyReason.selector);
        CreditMessagingRecovery(address(messaging)).mintCredits(batches, "");
    }

    function test_RevertIf_MintCredits_ByNonOwner(address _nonOwner) public {
        vm.assume(_nonOwner != OWNER);
        CreditBatch[] memory batches = new CreditBatch[](0);
        vm.prank(_nonOwner);
        vm.expectRevert(OWNABLE_ERROR);
        CreditMessagingRecovery(address(messaging)).mintCredits(batches, MINT_REASON);
    }

    function test_RevertIf_MintCredits_PlannerCannotMint() public {
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        CreditBatch[] memory batches = _buildMintBatches(1, 100);
        vm.prank(PLANNER);
        vm.expectRevert(OWNABLE_ERROR);
        CreditMessagingRecovery(address(messaging)).mintCredits(batches, MINT_REASON);
    }

    function test_RevertIf_MintCredits_UnavailableAsset(uint16 _assetId) public {
        _assetId = uint16(bound(_assetId, ASSET_ID + 1, type(uint16).max));
        Credit[] memory credits = new Credit[](1);
        credits[0] = Credit(1, 100);
        CreditBatch[] memory batches = new CreditBatch[](1);
        batches[0] = CreditBatch(_assetId, credits);
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        CreditMessagingRecovery(address(messaging)).mintCredits(batches, MINT_REASON);
    }

    function test_MintCredits_CallsReceiveCreditsAndDoesNotSendLzMessage(uint32 _srcEid, uint64 _amount) public {
        _amount = uint64(bound(_amount, 1, type(uint64).max));
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        CreditBatch[] memory batches = _buildMintBatches(_srcEid, _amount);
        _mockStargateReceiveCredits(batches[0].credits);

        vm.expectCall(STARGATE_IMPL, abi.encodeCall(ICreditMessagingHandler.receiveCredits, (0, batches[0].credits)));
        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsMinted(ASSET_ID, batches[0].credits, MINT_REASON);

        vm.recordLogs();
        CreditMessagingRecovery(address(messaging)).mintCredits(batches, MINT_REASON);
        _assertNoLzMessageSent();
    }

    function test_MintCredits_MultipleBatchesWithMultipleCreditsEach(uint64 _amount) public {
        _amount = uint64(bound(_amount, 1, type(uint64).max));
        address stargate2 = makeAddr("stargateImpl2");
        uint16 assetId2 = ASSET_ID + 1;
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        messaging.setAssetId(stargate2, assetId2);

        Credit[] memory credits1 = new Credit[](2);
        credits1[0] = Credit(1, _amount);
        credits1[1] = Credit(2, _amount);
        Credit[] memory credits2 = new Credit[](2);
        credits2[0] = Credit(3, _amount);
        credits2[1] = Credit(4, _amount);
        CreditBatch[] memory batches = new CreditBatch[](2);
        batches[0] = CreditBatch(ASSET_ID, credits1);
        batches[1] = CreditBatch(assetId2, credits2);

        _mockStargateReceiveCredits(STARGATE_IMPL, credits1);
        _mockStargateReceiveCredits(stargate2, credits2);

        vm.expectCall(STARGATE_IMPL, abi.encodeCall(ICreditMessagingHandler.receiveCredits, (0, credits1)));
        vm.expectCall(stargate2, abi.encodeCall(ICreditMessagingHandler.receiveCredits, (0, credits2)));
        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsMinted(ASSET_ID, credits1, MINT_REASON);
        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsMinted(assetId2, credits2, MINT_REASON);

        vm.recordLogs();
        CreditMessagingRecovery(address(messaging)).mintCredits(batches, MINT_REASON);
        _assertNoLzMessageSent();
    }

    function test_MintCredits_EmptyCreditsArray() public {
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);

        Credit[] memory emptyCredits = new Credit[](0);
        CreditBatch[] memory batches = new CreditBatch[](1);
        batches[0] = CreditBatch(ASSET_ID, emptyCredits);

        _mockStargateReceiveCredits(emptyCredits);

        vm.expectCall(STARGATE_IMPL, abi.encodeCall(ICreditMessagingHandler.receiveCredits, (0, emptyCredits)));
        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsMinted(ASSET_ID, emptyCredits, MINT_REASON);

        CreditMessagingRecovery(address(messaging)).mintCredits(batches, MINT_REASON);
    }

    // ---------------------------------- burnCredits ------------------------------------------

    function test_RevertIf_BurnCredits_EmptyReason() public {
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        TargetCreditBatch[] memory batches = _buildBurnBatches(1, 100);
        vm.expectRevert(ICreditMessagingRecovery.CreditMessagingRecovery_EmptyReason.selector);
        CreditMessagingRecovery(address(messaging)).burnCredits(batches, "");
    }

    function test_RevertIf_BurnCredits_ByNonOwner(address _nonOwner) public {
        vm.assume(_nonOwner != OWNER);
        TargetCreditBatch[] memory batches = new TargetCreditBatch[](0);
        vm.prank(_nonOwner);
        vm.expectRevert();
        CreditMessagingRecovery(address(messaging)).burnCredits(batches, BURN_REASON);
    }

    function test_RevertIf_BurnCredits_PlannerCannotBurn() public {
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        TargetCreditBatch[] memory batches = _buildBurnBatches(1, 100);
        vm.prank(PLANNER);
        vm.expectRevert();
        CreditMessagingRecovery(address(messaging)).burnCredits(batches, BURN_REASON);
    }

    function test_RevertIf_BurnCredits_UnavailableAsset(uint16 _assetId) public {
        _assetId = uint16(bound(_assetId, ASSET_ID + 1, type(uint16).max));
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit(1, 100, 100);
        TargetCreditBatch[] memory batches = new TargetCreditBatch[](1);
        batches[0] = TargetCreditBatch(_assetId, credits);
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        CreditMessagingRecovery(address(messaging)).burnCredits(batches, BURN_REASON);
    }

    function test_BurnCredits_CallsSendCreditsAndDoesNotSendLzMessage(uint32 _srcEid, uint64 _amount) public {
        _amount = uint64(bound(_amount, 1, type(uint64).max));
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        TargetCreditBatch[] memory batches = _buildBurnBatches(_srcEid, _amount);
        TargetCredit[] memory targets = batches[0].credits;
        _mockStargateSendCredits(0, targets, STARGATE_IMPL);

        vm.expectCall(STARGATE_IMPL, abi.encodeCall(ICreditMessagingHandler.sendCredits, (0, targets)));
        vm.expectEmit(true, true, true, true, address(messaging));
        Credit[] memory burned = new Credit[](1);
        burned[0] = Credit(_srcEid, _amount);
        emit ICreditMessagingRecovery.CreditsBurned(ASSET_ID, burned, BURN_REASON);

        vm.recordLogs();
        CreditMessagingRecovery(address(messaging)).burnCredits(batches, BURN_REASON);
        _assertNoLzMessageSent();
    }

    function test_BurnCredits_MultipleBatchesWithMultipleCreditsEach(uint64 _amount) public {
        _amount = uint64(bound(_amount, 1, type(uint64).max));
        address stargate2 = makeAddr("stargateImpl2");
        uint16 assetId2 = ASSET_ID + 1;
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        messaging.setAssetId(stargate2, assetId2);

        TargetCredit[] memory targets1 = new TargetCredit[](2);
        targets1[0] = TargetCredit(1, _amount, _amount);
        targets1[1] = TargetCredit(2, _amount, _amount);
        TargetCredit[] memory targets2 = new TargetCredit[](2);
        targets2[0] = TargetCredit(3, _amount, _amount);
        targets2[1] = TargetCredit(4, _amount, _amount);
        TargetCreditBatch[] memory batches = new TargetCreditBatch[](2);
        batches[0] = TargetCreditBatch(ASSET_ID, targets1);
        batches[1] = TargetCreditBatch(assetId2, targets2);

        _mockStargateSendCredits(0, targets1, STARGATE_IMPL);
        _mockStargateSendCredits(0, targets2, stargate2);

        Credit[] memory burned1 = new Credit[](2);
        burned1[0] = Credit(1, _amount);
        burned1[1] = Credit(2, _amount);
        Credit[] memory burned2 = new Credit[](2);
        burned2[0] = Credit(3, _amount);
        burned2[1] = Credit(4, _amount);

        vm.expectCall(STARGATE_IMPL, abi.encodeCall(ICreditMessagingHandler.sendCredits, (0, targets1)));
        vm.expectCall(stargate2, abi.encodeCall(ICreditMessagingHandler.sendCredits, (0, targets2)));
        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsBurned(ASSET_ID, burned1, BURN_REASON);
        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsBurned(assetId2, burned2, BURN_REASON);

        vm.recordLogs();
        CreditMessagingRecovery(address(messaging)).burnCredits(batches, BURN_REASON);
        _assertNoLzMessageSent();
    }

    function test_BurnCredits_EmitsActualBurnedAmounts_WhenHandlerReturnsPartial(
        uint32 _srcEid,
        uint64 _amount
    ) public {
        _amount = uint64(bound(_amount, 2, type(uint64).max));
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);

        TargetCreditBatch[] memory batches = _buildBurnBatches(_srcEid, _amount);
        TargetCredit[] memory targets = batches[0].credits;

        uint64 partialAmount = _amount / 2;
        Credit[] memory partialBurned = new Credit[](1);
        partialBurned[0] = Credit(_srcEid, partialAmount);
        vm.mockCall(
            STARGATE_IMPL,
            abi.encodeWithSelector(ICreditMessagingHandler.sendCredits.selector, uint32(0), targets),
            abi.encode(partialBurned)
        );

        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsBurned(ASSET_ID, partialBurned, BURN_REASON);

        CreditMessagingRecovery(address(messaging)).burnCredits(batches, BURN_REASON);
    }

    function test_BurnCredits_EmitsEmptyArray_WhenHandlerReturnsNothing(uint32 _srcEid, uint64 _amount) public {
        _amount = uint64(bound(_amount, 1, type(uint64).max));
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);

        TargetCreditBatch[] memory batches = _buildBurnBatches(_srcEid, _amount);
        TargetCredit[] memory targets = batches[0].credits;

        Credit[] memory noBurned = new Credit[](0);
        vm.mockCall(
            STARGATE_IMPL,
            abi.encodeWithSelector(ICreditMessagingHandler.sendCredits.selector, uint32(0), targets),
            abi.encode(noBurned)
        );

        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsBurned(ASSET_ID, noBurned, BURN_REASON);

        CreditMessagingRecovery(address(messaging)).burnCredits(batches, BURN_REASON);
    }

    // ---------------------------------- inherited negative tests overridden ------------------------------------------

    function test_MintCredits_NotAvailableOnCreditMessaging() public override {
        // skip this test since the function is available in CreditMessagingRecovery
        vm.skip(true);
    }

    function test_BurnCredits_NotAvailableOnCreditMessaging() public override {
        // skip this test since the function is available in CreditMessagingRecovery
        vm.skip(true);
    }

    // ---------------------------------- Helpers ------------------------------------------

    function _buildMintBatches(uint32 _srcEid, uint64 _amount) internal pure returns (CreditBatch[] memory batches) {
        batches = new CreditBatch[](1);
        Credit[] memory credits = new Credit[](1);
        credits[0] = Credit(_srcEid, _amount);
        batches[0] = CreditBatch(ASSET_ID, credits);
    }

    function _buildBurnBatches(
        uint32 _srcEid,
        uint64 _amount
    ) internal pure returns (TargetCreditBatch[] memory batches) {
        batches = new TargetCreditBatch[](1);
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit(_srcEid, _amount, _amount);
        batches[0] = TargetCreditBatch(ASSET_ID, credits);
    }

    function _mockStargateReceiveCredits(Credit[] memory _credits) internal {
        _mockStargateReceiveCredits(STARGATE_IMPL, _credits);
    }

    function _mockStargateReceiveCredits(address _stargate, Credit[] memory _credits) internal {
        vm.mockCall(_stargate, abi.encodeCall(ICreditMessagingHandler.receiveCredits, (0, _credits)), "");
    }

    function _assertNoLzMessageSent() internal {
        bytes32 packetSentTopic = keccak256("PacketSent(bytes,bytes,address)");
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].emitter == address(messaging.endpoint())) {
                assertNotEq(logs[i].topics[0], packetSentTopic, "unexpected LZ PacketSent event");
            }
        }
    }
}

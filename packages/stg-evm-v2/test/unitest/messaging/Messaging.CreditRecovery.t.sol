// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { TargetCredit, TargetCreditBatch } from "../../../src/interfaces/ICreditMessaging.sol";
import { ICreditMessagingHandler, Credit } from "../../../src/interfaces/ICreditMessagingHandler.sol";
import { CreditMessagingRecovery } from "../../../src/messaging/CreditMessagingRecovery.sol";
import { ICreditMessagingRecovery } from "../../../src/interfaces/ICreditMessagingRecovery.sol";
import { CreditMessaging, MessagingBase } from "../../../src/messaging/CreditMessaging.sol";
import { CreditBatch } from "../../../src/libs/CreditMsgCodec.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { CreditMessagingTest } from "./Messaging.Credit.t.sol";

contract CreditMessagingRecoveryTest is CreditMessagingTest {
    address internal immutable OWNER = address(this);
    uint16 internal constant ASSET_ID = 1;
    uint32 internal constant DST_EID = 7;
    string internal constant OWNABLE_ERROR = "Ownable: caller is not the owner";
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

    function test_RevertIf_MintCreditsByNonOwner(address _nonOwner) public {
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

        CreditMessagingRecovery(address(messaging)).mintCredits(batches, MINT_REASON);
    }

    // ---------------------------------- burnCredits ------------------------------------------

    function test_RevertIf_BurnCredits_EmptyReason() public {
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        TargetCreditBatch[] memory batches = _buildBurnBatches(1, 100);
        vm.expectRevert(ICreditMessagingRecovery.CreditMessagingRecovery_EmptyReason.selector);
        CreditMessagingRecovery(address(messaging)).burnCredits(batches, "");
    }

    function test_RevertIf_BurnCreditsByNonOwner(address _nonOwner) public {
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
        vm.mockCall(STARGATE_IMPL, abi.encodeCall(ICreditMessagingHandler.receiveCredits, (0, _credits)), "");
    }
}

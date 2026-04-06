// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";
import { TargetCredit, TargetCreditBatch } from "../../../src/interfaces/ICreditMessaging.sol";
import { ICreditMessagingHandler, Credit } from "../../../src/interfaces/ICreditMessagingHandler.sol";
import { CreditMessagingRecovery } from "../../../src/messaging/CreditMessagingRecovery.sol";
import { ICreditMessagingRecovery } from "../../../src/interfaces/ICreditMessagingRecovery.sol";
import { CreditMessaging, MessagingBase } from "../../../src/messaging/CreditMessaging.sol";
import { CreditBatch } from "../../../src/libs/CreditMsgCodec.sol";
import { IOAppCore } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";
import { MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";

contract CreditMessagingRecoveryTest is Test {
    address internal OWNER = address(this);
    address internal PLANNER = makeAddr("planner");
    address internal STARGATE_IMPL = makeAddr("stargateImpl");
    uint32 internal constant DST_EID = 7;
    uint16 internal constant ASSET_ID = 1;

    CreditMessagingRecovery public messaging;

    function setUp() public {
        messaging = new CreditMessagingRecovery(LzUtil.deployEndpointV2(1, address(this)), OWNER);
        messaging.setPlanner(PLANNER);
        messaging.setGasLimit(DST_EID, 500_000);
        messaging.setPeer(DST_EID, AddressCast.toBytes32(address(this)));
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
    }

    // ---------------------------------- mintCredits ------------------------------------------

    function test_RevertIf_MintCredits_EmptyReason() public {
        CreditBatch[] memory batches = _buildMintBatches(1, 100);
        vm.expectRevert(ICreditMessagingRecovery.CreditMessagingRecovery_EmptyReason.selector);
        messaging.mintCredits(batches, "");
    }

    function test_RevertIf_MintCreditsByNonOwner(address _nonOwner) public {
        vm.assume(_nonOwner != OWNER);
        CreditBatch[] memory batches = new CreditBatch[](0);
        vm.prank(_nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        messaging.mintCredits(batches, "test");
    }

    function test_RevertIf_MintCredits_PlannerCannotMint() public {
        CreditBatch[] memory batches = _buildMintBatches(1, 100);
        vm.prank(PLANNER);
        vm.expectRevert("Ownable: caller is not the owner");
        messaging.mintCredits(batches, "test");
    }

    function test_RevertIf_MintCredits_UnavailableAsset(uint16 _assetId) public {
        vm.assume(_assetId != ASSET_ID && _assetId > 0);
        Credit[] memory credits = new Credit[](1);
        credits[0] = Credit(1, 100);
        CreditBatch[] memory batches = new CreditBatch[](1);
        batches[0] = CreditBatch(_assetId, credits);
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        messaging.mintCredits(batches, "test");
    }

    function test_MintCredits_CallsReceiveCreditsAndDoesNotSendLzMessage(uint32 _srcEid, uint64 _amount) public {
        vm.assume(_amount > 0);
        CreditBatch[] memory batches = _buildMintBatches(_srcEid, _amount);
        _mockStargateReceiveCredits(batches[0].credits);

        vm.expectCall(STARGATE_IMPL, abi.encodeCall(ICreditMessagingHandler.receiveCredits, (0, batches[0].credits)));
        vm.expectEmit(true, true, true, true, address(messaging));
        emit ICreditMessagingRecovery.CreditsMinted(ASSET_ID, batches[0].credits, "restoring lost credits");

        messaging.mintCredits(batches, "restoring lost credits");
    }

    // ---------------------------------- burnCredits ------------------------------------------

    function test_RevertIf_BurnCredits_EmptyReason() public {
        TargetCreditBatch[] memory batches = _buildBurnBatches(1, 100);
        vm.expectRevert(ICreditMessagingRecovery.CreditMessagingRecovery_EmptyReason.selector);
        messaging.burnCredits(batches, "");
    }

    function test_RevertIf_BurnCreditsByNonOwner(address _nonOwner) public {
        vm.assume(_nonOwner != OWNER);
        TargetCreditBatch[] memory batches = new TargetCreditBatch[](0);
        vm.prank(_nonOwner);
        vm.expectRevert();
        messaging.burnCredits(batches, "test");
    }

    function test_RevertIf_BurnCredits_PlannerCannotBurn() public {
        TargetCreditBatch[] memory batches = _buildBurnBatches(1, 100);
        vm.prank(PLANNER);
        vm.expectRevert();
        messaging.burnCredits(batches, "test");
    }

    function test_RevertIf_BurnCredits_UnavailableAsset(uint16 _assetId) public {
        vm.assume(_assetId != ASSET_ID && _assetId > 0);
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit(1, 100, 100);
        TargetCreditBatch[] memory batches = new TargetCreditBatch[](1);
        batches[0] = TargetCreditBatch(_assetId, credits);
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        messaging.burnCredits(batches, "test");
    }

    function test_BurnCredits_CallsSendCreditsAndDoesNotSendLzMessage(uint32 _srcEid, uint64 _amount) public {
        vm.assume(_amount > 0);
        TargetCreditBatch[] memory batches = _buildBurnBatches(_srcEid, _amount);
        TargetCredit[] memory targets = batches[0].credits;
        _mockStargateSendCredits(0, targets);

        vm.expectCall(STARGATE_IMPL, abi.encodeCall(ICreditMessagingHandler.sendCredits, (0, targets)));
        vm.expectEmit(true, true, true, true, address(messaging));
        Credit[] memory burned = new Credit[](1);
        burned[0] = Credit(_srcEid, _amount);
        emit ICreditMessagingRecovery.CreditsBurned(ASSET_ID, burned, "correcting over-minted credits");

        messaging.burnCredits(batches, "correcting over-minted credits");
    }

    // ---------------------------------- sendCredits still works for planner ------------------------------------------

    function test_SendCredits_StillAccessibleByPlanner(uint32 _srcEid, uint64 _amount) public {
        vm.assume(_amount > 0);
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit(_srcEid, _amount, 0);
        TargetCreditBatch[] memory batches = new TargetCreditBatch[](1);
        batches[0] = TargetCreditBatch(ASSET_ID, credits);
        _mockStargateSendCredits(DST_EID, credits);
        _mockEndpointSend(100);

        // deal + prank planner
        hoax(PLANNER, 100);
        messaging.sendCredits{ value: 100 }(DST_EID, batches); // DST_EID is the only configured destination
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

    function _mockStargateSendCredits(uint32 _dstEid, TargetCredit[] memory _credits) internal {
        Credit[] memory actual = new Credit[](_credits.length);
        for (uint256 i = 0; i < _credits.length; i++) {
            actual[i] = Credit(_credits[i].srcEid, _credits[i].amount);
        }
        vm.mockCall(
            STARGATE_IMPL,
            abi.encodeWithSelector(ICreditMessagingHandler.sendCredits.selector, _dstEid, _credits),
            abi.encode(actual)
        );
    }

    function _mockEndpointSend(uint256 fee) internal {
        MessagingFee memory mockFee = MessagingFee({ nativeFee: fee, lzTokenFee: 0 });
        MessagingReceipt memory mockReceipt = MessagingReceipt({ guid: bytes32(0), nonce: 1, fee: mockFee });
        vm.mockCall(
            address(messaging.endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.send.selector),
            abi.encode(mockReceipt)
        );
    }
}

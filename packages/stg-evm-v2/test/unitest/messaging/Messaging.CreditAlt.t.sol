// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";
import { TargetCredit, TargetCreditBatch } from "../../../src/interfaces/ICreditMessaging.sol";
import { ICreditMessagingHandler, Credit } from "../../../src/interfaces/ICreditMessagingHandler.sol";
import { CreditMessagingAlt } from "../../../src/messaging/CreditMessagingAlt.sol";
import { CreditMessagingOptions } from "../../../src/messaging/CreditMessagingOptions.sol";
import { IOAppCore } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";
import { MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { AltFeeTokenMock } from "../../layerzero/mocks/AltFeeTokenMock.sol";

contract CreditMessagingAltTest is Test {
    address internal PLANNER = makeAddr("planner");
    address internal STARGATE_IMPL = makeAddr("stargateImpl");
    uint32 internal constant DST_EID = 7;
    uint16 internal constant ASSET_ID = 1;

    AltFeeTokenMock internal feeToken;
    CreditMessagingAlt internal messaging;

    function setUp() public {
        feeToken = new AltFeeTokenMock();
        address endpointAlt = LzUtil.deployEndpointV2Alt(1, address(this), address(feeToken));
        messaging = new CreditMessagingAlt(endpointAlt, address(this));
        messaging.setPlanner(PLANNER);
    }

    function test_RevertIf_NotAltEndpoint() public {
        address endpoint = LzUtil.deployEndpointV2(2, address(this));
        vm.expectRevert(CreditMessagingAlt.CreditMessaging_NotAnAltEndpoint.selector);
        new CreditMessagingAlt(endpoint, address(this));
    }

    function test_RevertIf_SendCreditsWithEthValue() public {
        _configureMessaging();
        TargetCreditBatch[] memory batches = _buildBatches();
        uint256 nativeFee = 321;

        // deal eth, mint and approve fee token to PLANNER
        vm.deal(PLANNER, 1 ether);
        feeToken.mint(PLANNER, nativeFee);
        vm.prank(PLANNER);
        feeToken.approve(address(messaging), nativeFee);

        _mockEndpointQuote(nativeFee);
        _mockEndpointSend(nativeFee);
        _mockStargateSendCredits(DST_EID, batches[0].credits, STARGATE_IMPL);

        vm.expectRevert(CreditMessagingAlt.CreditMessaging_OnlyAltToken.selector);
        vm.prank(PLANNER);
        messaging.sendCredits{ value: 1 }(DST_EID, batches);
    }

    function test_SendCredits_UsesQuoteAndAltFeeToken() public {
        _configureMessaging();
        TargetCreditBatch[] memory batches = _buildBatches();
        uint256 nativeFee = 321;

        feeToken.mint(PLANNER, nativeFee);
        vm.prank(PLANNER);
        feeToken.approve(address(messaging), nativeFee);

        _mockEndpointQuote(nativeFee);
        _mockEndpointSend(nativeFee);
        _mockStargateSendCredits(DST_EID, batches[0].credits, STARGATE_IMPL);

        vm.prank(PLANNER);
        messaging.sendCredits(DST_EID, batches);

        assertEq(feeToken.balanceOf(address(messaging.endpoint())), nativeFee);
    }

    // ---------------------------------------------------------------------
    // Helpers

    function _configureMessaging() internal {
        messaging.setGasLimit(DST_EID, 500_000);
        messaging.setPeer(DST_EID, AddressCast.toBytes32(address(this)));
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
    }

    function _buildBatches() internal pure returns (TargetCreditBatch[] memory batches) {
        batches = new TargetCreditBatch[](1);
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit({ srcEid: 1, amount: 10, minAmount: 0 });
        batches[0] = TargetCreditBatch({ assetId: ASSET_ID, credits: credits });
    }

    function _mockStargateSendCredits(uint32 _dstEid, TargetCredit[] memory _credits, address _stargate) internal {
        Credit[] memory actualCredits = new Credit[](_credits.length);
        for (uint256 i = 0; i < _credits.length; i++) {
            actualCredits[i] = Credit(_credits[i].srcEid, _credits[i].amount);
        }
        vm.mockCall(
            _stargate,
            abi.encodeWithSelector(ICreditMessagingHandler.sendCredits.selector, _dstEid, _credits),
            abi.encode(actualCredits)
        );
    }

    function _mockEndpointSend(uint256 fee) internal {
        MessagingFee memory mockMessagingFee = MessagingFee({ nativeFee: fee, lzTokenFee: 0 });
        MessagingReceipt memory mockReceipt = MessagingReceipt({ guid: bytes32(0), nonce: 1, fee: mockMessagingFee });
        vm.mockCall(
            address(messaging.endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.send.selector),
            abi.encode(mockReceipt)
        );
    }

    function _mockEndpointQuote(uint256 fee) internal {
        vm.mockCall(
            address(messaging.endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.quote.selector),
            abi.encode(MessagingFee(fee, 0))
        );
    }
}

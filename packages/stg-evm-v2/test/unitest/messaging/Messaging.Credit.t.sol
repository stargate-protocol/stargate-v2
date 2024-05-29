// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";
import { TargetCredit, TargetCreditBatch } from "../../../src/interfaces/ICreditMessaging.sol";
import { CreditMessaging, MessagingBase } from "../../../src/messaging/CreditMessaging.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { CreditMessagingOptions } from "../../../src/messaging/CreditMessagingOptions.sol";
import { IOAppCore } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { ICreditMessagingHandler, Credit } from "../../../src/interfaces/ICreditMessagingHandler.sol";

contract CreditMessagingTest is Test {
    address internal ALICE = makeAddr("alice");
    address internal PLANNER = makeAddr("planner");
    address internal STARGATE_IMPL = makeAddr("stargateImpl");
    uint8 internal constant MAX_NUM_ASSETS = 20;

    CreditMessaging public messaging;

    function _assumeAmountAndMinAmount(uint64 _amount, uint64 _minAmount) internal pure {
        vm.assume(_amount > 0 && _minAmount <= _amount);
    }

    function _assumePositiveGasLimit(uint256 _gasLimit) internal pure {
        vm.assume(_gasLimit > 0);
    }

    function _assumeNumAssets(uint8 _numAssets) internal pure {
        vm.assume(_numAssets < MAX_NUM_ASSETS);
    }

    function _assumeAssetId(uint16 _assetId) internal pure {
        vm.assume(_assetId > 0 && _assetId <= MAX_NUM_ASSETS);
    }

    function _assumeNonPlanner(address _nonPlanner) internal view {
        vm.assume(_nonPlanner != PLANNER);
    }

    function _createCreditBatches(
        uint32 _srcEid,
        uint16 _assetId,
        uint64 _amount,
        uint64 _minAmount
    ) internal pure returns (TargetCreditBatch[] memory) {
        TargetCreditBatch[] memory creditBatches = new TargetCreditBatch[](1);
        TargetCredit[] memory credits = new TargetCredit[](1);
        credits[0] = TargetCredit(_srcEid, _amount, _minAmount);
        creditBatches[0] = TargetCreditBatch(_assetId, credits);
        return creditBatches;
    }

    function setUp() public {
        messaging = new CreditMessaging(LzUtil.deployEndpointV2(1, address(this)), address(this));
        messaging.setPlanner(PLANNER);
    }

    function test_QuoteSendCreditsWithoutGasLimit(
        uint32 _srcEid,
        uint32 _dstEid,
        uint16 _assetId,
        uint64 _amount,
        uint64 _minAmount
    ) public {
        // 1. Test setup.
        _assumeAmountAndMinAmount(_amount, _minAmount);
        _assumeAssetId(_assetId);

        // Explicitly don't messaging.setGasLimit(...)
        TargetCreditBatch[] memory creditBatches = _createCreditBatches(_srcEid, _assetId, _amount, _minAmount);

        // 2. Test quoteSendCredits fails
        vm.expectRevert(CreditMessagingOptions.MessagingOptions_ZeroGasLimit.selector);
        messaging.quoteSendCredits(_dstEid, creditBatches);
    }

    function test_QuoteSendCreditsWithoutPeer(
        uint32 _srcEid,
        uint32 _dstEid,
        uint128 _gasLimit,
        uint16 _assetId,
        uint64 _amount,
        uint64 _minAmount
    ) public {
        // 1. Test setup.
        _assumePositiveGasLimit(_gasLimit);
        _assumeAmountAndMinAmount(_amount, _minAmount);

        // 2. Set the gas limit for the destination endpoint, but not the peer.
        messaging.setGasLimit(_dstEid, _gasLimit);
        TargetCreditBatch[] memory creditBatches = _createCreditBatches(_srcEid, _assetId, _amount, _minAmount);

        // 3. Ensure the quote reverts due to the missing peer.
        vm.expectRevert(abi.encodeWithSelector(IOAppCore.NoPeer.selector, _dstEid));
        messaging.quoteSendCredits(_dstEid, creditBatches);
    }

    function test_QuoteSendCredits_Success(
        uint8 _numAssets,
        uint64 _gasLimit,
        uint32 _dstEid,
        uint256 _nativeFee,
        uint64 _amount,
        uint64 _minAmount
    ) public {
        // 1. Test setup.
        _assumeNumAssets(_numAssets);
        _assumePositiveGasLimit(_gasLimit);
        _assumeAmountAndMinAmount(_amount, _minAmount);

        // 2. Set gas limit and peer info.
        uint8 numSrcEids = 10;
        messaging.setGasLimit(_dstEid, _gasLimit);
        messaging.setPeer(_dstEid, AddressCast.toBytes32(address(this)));

        // 3. Set up the credit batches from multiple srcEids
        TargetCreditBatch[] memory creditBatches = new TargetCreditBatch[](_numAssets);
        for (uint8 i = 0; i < _numAssets; i++) {
            uint16 assetId = i + 1;
            TargetCredit[] memory credits = new TargetCredit[](numSrcEids);
            for (uint8 j = 0; j < numSrcEids; j++) {
                uint32 srcEid = j + 1;
                credits[j] = TargetCredit(srcEid, _amount, _minAmount);
            }
            creditBatches[i] = TargetCreditBatch(assetId, credits);
        }

        // 4. Ensure that the quote is expected.
        _mockEndpointQuote(_nativeFee);
        MessagingFee memory fee = messaging.quoteSendCredits(_dstEid, creditBatches);
        assertEq(fee.nativeFee, _nativeFee);
    }

    function test_RevertIf_SendCreditsByNonPlanner(
        address _nonPlanner,
        uint32 _srcEid,
        uint32 _dstEid,
        uint16 _assetId,
        uint64 _amount,
        uint64 _minAmount
    ) public {
        // 1. Assume a non-Planner address attempts to sendCredits(...)
        _assumeNonPlanner(_nonPlanner);
        _assumeAssetId(_assetId);
        _assumeAmountAndMinAmount(_amount, _minAmount);

        // 2. Set up the credit batches.
        TargetCreditBatch[] memory creditBatches = _createCreditBatches(_srcEid, _assetId, _amount, _minAmount);

        // 3. Ensure the sendCredits(...) reverts due to the non-Planner address.
        vm.prank(_nonPlanner);
        vm.expectRevert(MessagingBase.Messaging_Unauthorized.selector);
        messaging.sendCredits(_dstEid, creditBatches);
    }

    function test_RevertIf_SendCreditsWithoutNecessarySteps(
        uint16 _assetId,
        uint32 _srcEid,
        uint32 _dstEid,
        uint64 _gasLimit,
        uint64 _amount,
        uint64 _minAmount
    ) public {
        // 1. Setup the test.
        _assumeAssetId(_assetId);
        _assumePositiveGasLimit(_gasLimit);
        _assumeAmountAndMinAmount(_amount, _minAmount);

        // 2. Create and mock sending the credit batches.
        TargetCreditBatch[] memory creditBatches = _createCreditBatches(_srcEid, _assetId, _amount, _minAmount);
        _mockStargateSendCredits(_dstEid, creditBatches[0].credits, STARGATE_IMPL);
        _mockEndpointSend(_gasLimit);

        // 3. Ensure the sendCredits(...) reverts due to the MessagingUnavailable.
        vm.prank(PLANNER);
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        messaging.sendCredits(_dstEid, creditBatches);

        // 4. Enable messaging for the particular asset.
        messaging.setAssetId(STARGATE_IMPL, _assetId);

        // 5. Ensure the sendCredits(...) reverts due to the missing gas limit.
        vm.prank(PLANNER);
        vm.expectRevert(CreditMessagingOptions.MessagingOptions_ZeroGasLimit.selector);
        messaging.sendCredits(_dstEid, creditBatches);

        // 6. Set the gas limit for the destination endpoint.
        messaging.setGasLimit(_dstEid, _gasLimit);

        // 7. Ensure the sendCredits(...) reverts due to the missing peer.
        vm.prank(PLANNER);
        vm.expectRevert(abi.encodeWithSelector(IOAppCore.NoPeer.selector, _dstEid));
        messaging.sendCredits(_dstEid, creditBatches);

        // 8. Set the peer for the destination endpoint.
        messaging.setPeer(_dstEid, AddressCast.toBytes32(address(this)));

        // 9. Ensure sendCredits succeeds.
        vm.prank(PLANNER);
        messaging.sendCredits(_dstEid, creditBatches);
    }

    function test_SendCredits(uint64 _gasLimit, uint32 _dstEid, uint8 _numAssets) public {
        // 1. Setup the test.
        _assumeNumAssets(_numAssets);
        _assumePositiveGasLimit(_gasLimit);
        uint8 _numSrcEids = 10;

        // 2. Set up the configuration facets including gas limit and peer info.
        messaging.setGasLimit(_dstEid, _gasLimit);
        messaging.setPeer(_dstEid, AddressCast.toBytes32(address(this)));

        // 3. Create and mock sending the credit batches.
        TargetCreditBatch[] memory creditBatches = new TargetCreditBatch[](_numAssets);
        for (uint8 i = 0; i < _numAssets; i++) {
            uint16 assetId = i + 1;
            TargetCredit[] memory credits = new TargetCredit[](_numSrcEids);
            for (uint8 j = 0; j < _numSrcEids; j++) {
                uint32 srcEid = j + 1;
                credits[j] = TargetCredit(srcEid, 100, 0);
            }
            creditBatches[i] = TargetCreditBatch(assetId, credits);
        }
        for (uint8 i = 0; i < _numAssets; i++) {
            uint16 assetId = i + 1;
            address stargate = address(uint160(STARGATE_IMPL) + i);
            messaging.setAssetId(stargate, assetId);
            _mockStargateSendCredits(_dstEid, creditBatches[i].credits, stargate);
        }
        _mockEndpointSend(100);

        // 4. Ensure sendCredits succeeds.
        vm.prank(PLANNER);
        messaging.sendCredits(_dstEid, creditBatches);
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

    function _mockEndpointQuote(uint256 fee) internal {
        vm.mockCall(
            address(messaging.endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.quote.selector),
            abi.encode(MessagingFee(fee, 0))
        );
    }

    function _mockEndpointSend(uint256 fee) internal {
        MessagingFee memory mockMessagingFee = MessagingFee({ nativeFee: fee, lzTokenFee: 0 });
        MessagingReceipt memory mockReceipt = MessagingReceipt({ guid: "0", nonce: 1, fee: mockMessagingFee });
        vm.mockCall(
            address(messaging.endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.send.selector),
            abi.encode(mockReceipt)
        );
    }
}

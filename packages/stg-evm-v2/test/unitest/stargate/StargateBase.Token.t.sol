// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { SendParam, MessagingFee, MessagingReceipt, IOFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OFTComposeMsgCodec } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/libs/OFTComposeMsgCodec.sol";
import { OFTLimit, OFTFeeDetail, OFTReceipt, SendParam, MessagingReceipt, MessagingFee, IOFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { StargateType } from "../../../src/interfaces/IStargate.sol";
import { IStargateFeeLib } from "../../../src/interfaces/IStargateFeeLib.sol";
import { ITokenMessaging } from "../../../src/interfaces/ITokenMessaging.sol";
import { TargetCredit } from "../../../src/interfaces/ICreditMessaging.sol";
import { ICreditMessagingHandler } from "../../../src/interfaces/ICreditMessagingHandler.sol";
import { PathLib, Path } from "../../../src/libs/Path.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { TokenMessaging } from "../../../src/messaging/TokenMessaging.sol";
import { ERC20Token } from "../../../src/mocks/ERC20Token.sol";
import { OftCmdHelper } from "../../utils/OftCmdHelper.sol";
import { StargateBaseTestHelper } from "../helper/StargateBaseTestHelper.sol";

contract StargateBaseTokenTest is StargateBaseTestHelper {
    uint32 internal constant DST_EID = 2;
    bytes32 internal constant MOCK_GUID = bytes32(uint(1));
    string internal constant MOCK_TOKEN_NAME = "Mock";
    string internal constant MOCK_TOKEN_SYMBOL = "MCK";
    uint8 internal constant MOCK_TOKEN_DECIMALS = 6;

    event ComposeSent(address from, address to, bytes32 guid, uint16 index, bytes message);

    function _assumeAmountSD(uint64 _amountSD) internal view returns (uint256) {
        return _assumeAmountSD(_amountSD, 1);
    }

    function _assumeAmountSD(uint64 _amountSD, uint64 _minAmountSD) internal view returns (uint256) {
        vm.assume(_amountSD >= _minAmountSD);
        return _sd2ld(_amountSD);
    }

    function _assumeLimitedPathCredit(uint64 _amountSD, uint64 _additionalCredit) internal pure {
        vm.assume(uint256(_amountSD) + _additionalCredit < PathLib.UNLIMITED_CREDIT);
    }

    function _assumePathCreditDeficit(uint64 _amountSD, uint64 _creditDeficit) internal pure {
        vm.assume(_creditDeficit > 0 && _creditDeficit < _amountSD);
    }

    /// @dev Ensures the nonce positive and fits within the bounds of a uint64.
    function _assumeNonce(uint64 _nonce) internal pure {
        vm.assume(_nonce > 0 && _nonce < type(uint64).max);
    }

    function _assumePositiveLZFee(uint256 _lzFee) internal pure {
        vm.assume(_lzFee > 0);
    }

    function _assumeComposeMsg(bytes memory _composeMsg, uint8 _maxLength) internal pure {
        vm.assume(_composeMsg.length > 0 && _composeMsg.length <= _maxLength);
    }

    function _assumeComposeMsg(bytes memory _composeMsg) internal pure {
        _assumeComposeMsg(_composeMsg, 32);
    }

    function _createMockToken() internal returns (ERC20Token) {
        return new ERC20Token(MOCK_TOKEN_NAME, MOCK_TOKEN_SYMBOL, MOCK_TOKEN_DECIMALS);
    }

    function _determineComposeMsg(bool _isTaxi, bytes memory _composeMsg) internal pure returns (bytes memory) {
        return _isTaxi ? _composeMsg : new bytes(0);
    }

    function _determineNativeDrop(bool _nativeDrop) internal pure returns (uint8) {
        return _nativeDrop ? 1 : 0;
    }

    function _determineOftCmd(bool _isTaxi) internal pure returns (bytes memory) {
        return _isTaxi ? OftCmdHelper.taxi() : OftCmdHelper.bus();
    }

    function _mockMessagingAndFeeLibOutput(
        bool _isTaxi,
        uint256 _amountInLD
    ) internal returns (MessagingReceipt memory mockReceipt, uint256 amountOutLD) {
        mockReceipt = _isTaxi ? mockMessagingTaxi() : mockMessagingRideBus();
        amountOutLD = mockFeeLibOutput(_amountInLD);
    }

    // ---- taxi mode -----

    /// @dev Test sending a taxi message and paying in LZToken.
    function test_TaxiWithLzTokenFee(uint64 _amountInSD, uint64 _nonce, uint16 _nativeFee, uint16 _lzFee) public {
        // 1. Assume a positive _amountInSD, a message nonce that fits within a uint64 container, and a positive _lzFee.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumeNonce(_nonce);
        _assumePositiveLZFee(_lzFee);

        // 2. Set the ability to pay in Mock ERC20Token.
        stargate.setOFTPath(DST_EID, true);
        _setLzToken(address(_createMockToken()));
        _maxApproveStargatePaymentInLZToken();
        uint256 beforeLZTokenBalance = ERC20Token(lzToken).balanceOf(address(this));

        // 3. Mock messaging and fee lib output.
        MessagingReceipt memory mockReceipt = mockMessagingTaxi(MOCK_GUID, _nonce, _nativeFee, _lzFee);
        uint256 amountOutLD = mockFeeLibOutput(amountInLD); // no fee

        // 4. Send the token, ensuring OFTSent event is emitted.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, amountOutLD, OftCmdHelper.taxi());
        vm.expectEmit();
        emit IOFT.OFTSent(mockReceipt.guid, sendParam.dstEid, address(this), amountInLD, amountOutLD);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));

        // 5. Ensure the credit is unlimited and the lzToken balance is reduced by _lzFee.
        assertEq(stargate.getCredit(DST_EID), PathLib.UNLIMITED_CREDIT);
        assertEq(ERC20Token(lzToken).balanceOf(address(this)), beforeLZTokenBalance - _lzFee);
    }

    function test_TaxiRevertIf_Stargate_LzTokenUnavailable(
        uint64 _amountInSD,
        uint64 _nonce,
        uint16 _nativeFee,
        uint16 _lzFee
    ) public {
        // 1. Assume a positive _amountSD
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumePositiveLZFee(_lzFee);
        stargate.setOFTPath(DST_EID, true);

        // 2. Mock messaging and fee lib output.
        MessagingReceipt memory mockReceipt = mockMessagingTaxi(MOCK_GUID, _nonce, _nativeFee, _lzFee);
        uint256 amountOutLD = mockFeeLibOutput(amountInLD);

        // 3. Expect the call to revert if the lzToken is not set (no call to _setLzToken(...)).
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, amountOutLD, OftCmdHelper.taxi());
        vm.expectRevert(StargateBase.Stargate_LzTokenUnavailable.selector);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));
    }

    // ---- bus mode -----

    /// @dev Test that paying for a rideBus message in LZToken reverts.  Paying for rideBus in LZToken is not supported.
    function test_RevertIf_RideBusWithLzTokenFee(
        uint64 _amountInSD,
        uint64 _nonce,
        uint16 _nativeFee,
        uint16 _lzFee
    ) public {
        // 1. Test assumptions and setup.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumeNonce(_nonce);
        _assumePositiveLZFee(_lzFee);
        stargate.setOFTPath(DST_EID, true);

        // 2. Set up payment in LZToken.
        _setLzToken(address(_createMockToken()));
        _maxApproveStargatePaymentInLZToken();

        // 3. Mock messaging and fee lib output.
        MessagingReceipt memory mockReceipt = mockMessagingRideBus(MOCK_GUID, _nonce, _nativeFee, _lzFee);
        uint256 amountOutLD = mockFeeLibOutput(amountInLD); // no fee

        // 4. Expect the call to revert, as one cannot pay for rideBus using LZToken.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, amountOutLD, OftCmdHelper.bus());
        vm.expectRevert(StargateBase.Stargate_LzTokenUnavailable.selector);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));
    }

    // ---- common -----
    function test_SendToPool(
        uint64 _amountInSD,
        uint56 _additionalCredit,
        bool _isTaxi,
        bool _nativeDrop,
        bytes memory _composeMsg
    ) public {
        // 1. Set up the test.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumeLimitedPathCredit(_amountInSD, _additionalCredit);

        // 2. Increase credit from dstEid, ensuring the Path does not have unlimited credit.
        stargate.increaseCredit(DST_EID, _amountInSD + uint64(_additionalCredit));

        // 3. Mock messaging and fee lib output
        (MessagingReceipt memory mockReceipt, uint256 amountOutLD) = _mockMessagingAndFeeLibOutput(_isTaxi, amountInLD);

        // 4. Send the token, ensuring OFTSent event is emitted.
        SendParam memory sendParam = buildSendParam(
            ALICE,
            DST_EID,
            amountInLD,
            amountInLD,
            _determineComposeMsg(_isTaxi, _composeMsg),
            _determineNativeDrop(_nativeDrop),
            _determineOftCmd(_isTaxi)
        );
        vm.expectEmit();
        emit IOFT.OFTSent(mockReceipt.guid, sendParam.dstEid, address(this), amountInLD, amountOutLD);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));

        // 5. Ensure the credit is increased by _additionalCredit.
        assertEq(stargate.getCredit(DST_EID), _additionalCredit);
    }

    function test_SendToOFT(uint64 _amountInSd, bool _isTaxi) public {
        // 1. Set up the test.
        uint256 amountInLD = _assumeAmountSD(_amountInSd);
        stargate.setOFTPath(DST_EID, true);

        // 2. Mock messaging and fee lib output
        (MessagingReceipt memory mockReceipt, uint256 amountOutLD) = _mockMessagingAndFeeLibOutput(_isTaxi, amountInLD);

        // 3. Send the token, ensuring OFTSent event is emitted.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, _determineOftCmd(_isTaxi));
        vm.expectEmit();
        emit IOFT.OFTSent(mockReceipt.guid, sendParam.dstEid, address(this), amountInLD, amountOutLD);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));

        // 4. Ensure the credit is unlimited.
        assertEq(stargate.getCredit(DST_EID), PathLib.UNLIMITED_CREDIT);
    }

    function test_RevertIf_SendToPoolWithoutEnoughCredit(uint64 _amountInSD, uint64 _creditDeficit) public {
        // 1. Set up the test, ensuring there is a positive credit deficit that does not exceed _amountInSD.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumePathCreditDeficit(_amountInSD, _creditDeficit);

        // 2. increase credit from dstEid, but ensure there is not enough credit to send.
        stargate.increaseCredit(DST_EID, _amountInSD - _creditDeficit);

        // 3. Mock messaging and fee lib output.
        MessagingReceipt memory taxiMockReceipt = mockMessagingTaxi();
        MessagingReceipt memory busMockReceipt = mockMessagingRideBus();
        mockFeeLibOutput(amountInLD);

        // 4. Expect the call to revert since there is not enough credit to taxi.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.taxi());
        vm.expectRevert(PathLib.Path_InsufficientCredit.selector);
        stargate.send{ value: taxiMockReceipt.fee.nativeFee }(sendParam, taxiMockReceipt.fee, address(this));

        // 5. Expect the call to revert since there is not enough credit to rideBus.
        sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.bus());
        vm.expectRevert(PathLib.Path_InsufficientCredit.selector);
        stargate.send{ value: taxiMockReceipt.fee.nativeFee }(sendParam, busMockReceipt.fee, address(this));
    }

    function test_SendWithReward(uint32 _amountInSD, int8 _rewardBps, bool _isTaxi) public {
        // 1. Set up the test, including rewardBps and treasuryFee.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        int16 rewardBps = int16(_rewardBps > 0 ? -_rewardBps : _rewardBps);
        stargate.setOFTPath(DST_EID, true);

        // 2. mock messaging and fee lib output.
        MessagingReceipt memory mockReceipt = _isTaxi ? mockMessagingTaxi() : mockMessagingRideBus();
        uint256 amountOutLD = mockFeeLibOutput(amountInLD, rewardBps);
        uint256 expectedRewardLD = amountOutLD - amountInLD;

        // 3. Ensure that the treasuryFeeLD is enough to cover the reward.
        uint64 treasuryFeeSD = _ld2sd(expectedRewardLD) + 1; // ensures the treasuryFee is enough to cover the reward
        uint256 treasuryFeeLD = _sd2ld(treasuryFeeSD);
        vm.prank(treasurer);
        stargate.addTreasuryFee(treasuryFeeLD);

        // 4. Send the token, ensuring OFTSent event is emitted.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, _determineOftCmd(_isTaxi));
        vm.expectEmit();
        emit IOFT.OFTSent(mockReceipt.guid, sendParam.dstEid, address(this), amountInLD, amountOutLD);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));
        assertEq(stargate.getCredit(DST_EID), PathLib.UNLIMITED_CREDIT);

        // 5. Check the treasury is decreased by the expected reward.
        assertEq(_sd2ld(treasuryFeeSD - stargate.treasuryFee()), expectedRewardLD);
    }

    function test_SendWithFee(uint32 _amountInSD, int8 _feeBps, bool _isTaxi) public {
        // 1. Assume _amountInSD won't cause slippage to exceed expectations.
        uint256 amountInLD = _assumeAmountSD(_amountInSD, 10_000);
        vm.assume(_feeBps > -128);
        int16 feeBps = int16(_feeBps < 0 ? -_feeBps : _feeBps);
        stargate.setOFTPath(DST_EID, true);

        // 2. Mock messaging and fee lib output.
        MessagingReceipt memory mockReceipt = _isTaxi ? mockMessagingTaxi() : mockMessagingRideBus();
        uint256 amountOutLD = mockFeeLibOutput(amountInLD, feeBps);

        // 3. Send the token, ensuring OFTSent event is emitted.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, amountOutLD, _determineOftCmd(_isTaxi));
        vm.expectEmit();
        emit IOFT.OFTSent(mockReceipt.guid, sendParam.dstEid, address(this), amountInLD, amountOutLD);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));
        assertEq(stargate.getCredit(DST_EID), PathLib.UNLIMITED_CREDIT); // credit is unlimited

        // 4. Check the treasury collected the expected fee.
        assertEq(_sd2ld(stargate.treasuryFee()), amountInLD - amountOutLD);
    }

    function test_RevertIf_SendWithNotEnoughFee(
        uint32 _amountInSD,
        uint64 _nonce,
        uint64 _nativeFee,
        uint8 _nativeFeeDeficit
    ) public {
        // 1. Assume there is a positive native fee deficit that is less than the native fee.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumeNonce(_nonce);
        vm.assume(_nativeFeeDeficit > 0 && _nativeFeeDeficit < _nativeFee);
        stargate.setOFTPath(DST_EID, true);

        // 2. Mock messaging and fee lib output.
        MessagingReceipt memory mockReceipt = mockMessagingTaxi(MOCK_GUID, _nonce, _nativeFee);
        amountInLD = mockFeeLibOutput(amountInLD);

        // 3. Test that sending a taxi reverts if not enough native is provided
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.taxi());
        vm.expectRevert(StargateBase.Stargate_InvalidAmount.selector);
        stargate.send{ value: mockReceipt.fee.nativeFee - _nativeFeeDeficit }(
            sendParam,
            mockReceipt.fee,
            address(this)
        );

        // 4. Test that riding a bus reverts if not enough native is provided
        mockReceipt = mockMessagingRideBus(MOCK_GUID, _nonce, _nativeFee);
        sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.bus());
        vm.expectRevert(StargateBase.Stargate_InvalidAmount.selector);
        stargate.send{ value: mockReceipt.fee.nativeFee - _nativeFeeDeficit }(
            sendParam,
            mockReceipt.fee,
            address(this)
        );
    }

    function test_RevertIf_Send0Amount() public {
        // 1. Assume amountInLD is 0.
        uint256 amountInLD = 0;

        // 2. Mock messaging and fee lib output.
        MessagingReceipt memory mockReceipt = mockMessagingTaxi();
        mockFeeLibOutput(0);

        // 3. Test that sending a taxi reverts due to slippage if the amount is 0.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.taxi());
        vm.expectRevert(StargateBase.Stargate_SlippageTooHigh.selector);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));

        // 4. Test that riding a bus reverts due to slippage if the amount is 0.
        sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.bus());
        vm.expectRevert(StargateBase.Stargate_SlippageTooHigh.selector);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));
    }

    function test_RevertIf_SlippageTooHigh(uint32 _amountInSD, uint32 _surplusAmountSD) public {
        // 1. _surplusAmountSD is assumed greater than 0, to ensure that when converted to LD the "surplusAmountLD" > 0.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        vm.assume(_surplusAmountSD > 0);
        stargate.setOFTPath(DST_EID, true);

        // 2. Mock messaging and fee lib output.
        MessagingReceipt memory mockReceipt = mockMessagingTaxi();
        uint256 amountOutLD = mockFeeLibOutput(amountInLD); // no fee

        // 3. Test that sending a taxi reverts due to slippage
        SendParam memory sendParam = buildSendParam(
            ALICE,
            DST_EID,
            amountInLD,
            amountOutLD + _sd2ld(_surplusAmountSD), // cause slippage
            OftCmdHelper.taxi()
        );
        vm.expectRevert(StargateBase.Stargate_SlippageTooHigh.selector);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));

        // 4. Test that riding the bus reverts due to slippage
        buildSendParam(ALICE, DST_EID, amountInLD, amountOutLD + _sd2ld(_surplusAmountSD), OftCmdHelper.bus());
        vm.expectRevert(StargateBase.Stargate_SlippageTooHigh.selector);
        stargate.send{ value: mockReceipt.fee.nativeFee }(sendParam, mockReceipt.fee, address(this));
    }

    function test_RevertIf_SendPaused(uint64 _amountInSD) public {
        // 1. Pause the Stargate instance.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        vm.prank(planner);
        stargate.setPause(true);

        // 2. Expect the taxi request to revert due to Stargate_Paused
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.taxi());
        vm.expectRevert(StargateBase.Stargate_Paused.selector);
        stargate.send{ value: 0 }(sendParam, MessagingFee(0, 0), address(this));
    }

    function test_ReceiveToken(uint32 _amountInSD, uint64 _nonce) public {
        // 1. Set up the test.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumeNonce(_nonce);
        Origin memory origin = Origin({ srcEid: 2, sender: AddressCast.toBytes32(ALICE), nonce: _nonce });

        // 2. Ensure the OFTReceived event is emitted.
        vm.expectEmit();
        emit IOFT.OFTReceived(MOCK_GUID, origin.srcEid, ALICE, amountInLD);
        vm.prank(creditMessaging);
        stargate.receiveTokenBus(origin, MOCK_GUID, 0, ALICE, _amountInSD);
    }

    function test_ReceiveTokenWithComposedMessage(uint32 _amountInSD, uint64 _nonce, bytes memory _composeMsg) public {
        // 1. Set up a _composeMsg test case.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumeNonce(_nonce);
        _assumeComposeMsg(_composeMsg);
        Origin memory origin = Origin({ srcEid: 2, sender: AddressCast.toBytes32(ALICE), nonce: _nonce });
        bytes memory oftComposedMsg = OFTComposeMsgCodec.encode(origin.nonce, origin.srcEid, amountInLD, _composeMsg);

        // 2. Ensure the OFTReceived event is emitted, and the composed message is sent (ComposeSent emitted).
        vm.expectEmit();
        emit ComposeSent(address(stargate), ALICE, MOCK_GUID, 0, oftComposedMsg);
        vm.expectEmit();
        emit IOFT.OFTReceived(MOCK_GUID, origin.srcEid, ALICE, _sd2ld(_amountInSD));
        vm.prank(tokenMessaging);
        stargate.receiveTokenTaxi(origin, MOCK_GUID, ALICE, _amountInSD, _composeMsg);
    }

    function test_ReceiveTokenWithOutflowFail(uint32 _amountInSD, uint64 _nonce, address _nefariousReceiver) public {
        // 1. Set up the test, including ensuring outflow fails.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumeNonce(_nonce);
        vm.assume(_nefariousReceiver != ALICE);
        stargate.setMockOutflowFail(true);

        Origin memory origin = Origin({ srcEid: DST_EID, sender: AddressCast.toBytes32(ALICE), nonce: _nonce });

        // 2. Cause the token to be cached.
        vm.expectEmit();
        emit StargateBase.UnreceivedTokenCached(MOCK_GUID, 0, origin.srcEid, ALICE, amountInLD, ""); // bus does not support composeMsg
        vm.prank(tokenMessaging);
        stargate.receiveTokenBus(origin, MOCK_GUID, 0, ALICE, _amountInSD);

        // 3. Ensure outflow will succeed.
        stargate.setMockOutflowFail(false);

        // 4. Ensure a retry of the token is unsuccessful if called with a different receiver.
        vm.expectRevert(StargateBase.Stargate_UnreceivedTokenNotFound.selector);
        stargate.retryReceiveToken(MOCK_GUID, 0, origin.srcEid, _nefariousReceiver, amountInLD, "");

        // 5. Ensure a retry of the token is successful if called with the original receiver (ALICE).
        vm.expectEmit();
        emit IOFT.OFTReceived(MOCK_GUID, origin.srcEid, ALICE, amountInLD);
        stargate.retryReceiveToken(MOCK_GUID, 0, origin.srcEid, ALICE, amountInLD, "");
    }

    function test_ReceiveTokenOutflowFailWithComposeMsg(
        uint32 _amountInSD,
        uint64 _nonce,
        bytes memory _composeMsg,
        address _nefariousReceiver
    ) public {
        // 1. Assume outflow will fail.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _assumeNonce(_nonce);
        _assumeComposeMsg(_composeMsg);
        vm.assume(_nefariousReceiver != ALICE);
        stargate.setMockOutflowFail(true);

        // 2. Cache the taxi message.
        Origin memory origin = Origin({ srcEid: 2, sender: AddressCast.toBytes32(ALICE), nonce: _nonce });
        bytes memory oftComposedMsg = OFTComposeMsgCodec.encode(origin.nonce, origin.srcEid, amountInLD, _composeMsg);
        vm.expectEmit();
        emit StargateBase.UnreceivedTokenCached(
            MOCK_GUID,
            0,
            origin.srcEid,
            ALICE,
            _sd2ld(_amountInSD),
            oftComposedMsg
        );
        vm.prank(tokenMessaging);
        stargate.receiveTokenTaxi(origin, MOCK_GUID, ALICE, _amountInSD, _composeMsg);

        // 3. Ensure outflow will succeed.
        stargate.setMockOutflowFail(false);

        // 4. Ensure a retry of the token is unsuccessful if called with a different receiver.
        vm.expectRevert(StargateBase.Stargate_UnreceivedTokenNotFound.selector);
        stargate.retryReceiveToken(MOCK_GUID, 0, origin.srcEid, _nefariousReceiver, amountInLD, oftComposedMsg);

        // 5. Ensure a retry of the token is successful if called with the original receiver (ALICE).
        vm.expectEmit();
        emit IOFT.OFTReceived(MOCK_GUID, origin.srcEid, ALICE, amountInLD);
        stargate.retryReceiveToken(MOCK_GUID, 0, origin.srcEid, ALICE, amountInLD, oftComposedMsg);
    }

    function test_QuoteSendTaxi(
        uint32 _amountInSD,
        uint256 _nativeFee,
        bool _payInLzToken,
        uint256 _lzTokenFee
    ) public {
        // 1. Set up the test.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);

        // 2. Mock messaging and fee lib output
        MessagingFee memory expectedFee = mockMessagingQuoteTaxi(_nativeFee, _payInLzToken ? _lzTokenFee : 0);
        mockFeeLibOutput(amountInLD);

        // 3. Quote the fee.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.taxi());
        MessagingFee memory actualFee = stargate.quoteSend(sendParam, _payInLzToken);

        // 4. Ensure the quoted fee is as expected.
        assertEq(actualFee.nativeFee, expectedFee.nativeFee);
        assertEq(actualFee.lzTokenFee, expectedFee.lzTokenFee);
    }

    function test_QuoteRideBus(
        uint32 _amountInSD,
        uint64 _busBaseFare,
        uint16 _baseFareMultiplierBps,
        uint8 _extraFare
    ) public {
        // 1. Setup the test.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        vm.assume(_busBaseFare > 0); // busBaseFare must be positive

        // 2. Mock messaging and fee lib output
        MessagingFee memory fee = mockMessagingQuoteRideBus(_busBaseFare, _baseFareMultiplierBps, _extraFare);
        mockFeeLibOutput(amountInLD);

        // 3. Quote the fee.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, OftCmdHelper.bus());
        MessagingFee memory feeQuoted = stargate.quoteSend(sendParam, false);

        // 4. Ensure the quoted fee is as expected.
        assertEq(feeQuoted.nativeFee, fee.nativeFee);
        assertEq(feeQuoted.lzTokenFee, 0); // bus does not support payment in LZToken
    }

    function test_RevertIf_QuoteSend0Amount(bool _isTaxi, bool _payInLzToken) public {
        // 1. Assume amountInLD is 0.
        uint64 amountInSD = 0;

        // 2. Ensure quoteSend() reverts if the amountInSD is 0.
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInSD, amountInSD, _determineOftCmd(_isTaxi));
        vm.expectRevert(StargateBase.Stargate_InvalidAmount.selector);
        stargate.quoteSend(sendParam, _payInLzToken);
    }

    function test_QuoteOFT(uint32 _amountInSD, uint64 _creditSD, int16 _fee) public {
        // 1. Setup the test.
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        _fee = int16(bound(_fee, -1, 1)); // -1: 1% fee, 0: no fee, 1: 1% reward
        _creditSD = uint64(bound(_creditSD, 0, PathLib.UNLIMITED_CREDIT - 1));

        // 2. Mock messaging and fee lib output
        SendParam memory sendParam = buildSendParam(ALICE, DST_EID, amountInLD, amountInLD, OftCmdHelper.taxi());
        uint256 amountOutLD = mockFeeLibOutput(amountInLD, _fee * 100);

        // 3. Increase the path credit
        stargate.increaseCredit(DST_EID, _creditSD);
        uint256 creditLD = _sd2ld(_creditSD);

        // 4. Quote the OFT.
        (OFTLimit memory limit, OFTFeeDetail[] memory oftFeeDetails, OFTReceipt memory receipt) = stargate.quoteOFT(
            sendParam
        );

        // 5. Validate quote.
        assertEq(limit.maxAmountLD, creditLD);
        uint256 amountSendLD = amountInLD > creditLD ? creditLD : amountInLD;
        assertEq(receipt.amountSentLD, amountSendLD);
        assertEq(receipt.amountReceivedLD, amountOutLD);
        assertEq(oftFeeDetails.length, amountSendLD == amountOutLD ? 0 : 1);
        if (oftFeeDetails.length > 0) {
            assertEq(oftFeeDetails[0].feeAmountLD, int(amountOutLD) - int(amountSendLD)); // conversion to int allows for negative fee
        }
    }
}

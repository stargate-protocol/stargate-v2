// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { SendParam, MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { StargateType } from "../../../src/interfaces/IStargate.sol";
import { IStargateFeeLib } from "../../../src/interfaces/IStargateFeeLib.sol";
import { ITokenMessaging, Ticket } from "../../../src/interfaces/ITokenMessaging.sol";
import { StargateBase, FeeParams } from "../../../src/StargateBase.sol";
import { StargatePool } from "../../../src/StargatePool.sol";
import { PoolToken } from "../../../src/mocks/PoolToken.sol";
import { OftCmdHelper } from "../../utils/OftCmdHelper.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { StargatePoolNative } from "../../../src/StargatePoolNative.sol";

contract StargateBaseTestHelper is Test {
    using OptionsBuilder for bytes;
    address internal constant ALICE = address(0xace);
    address internal constant BOB = address(0xbb);

    bytes internal constant NOT_OWNER_ERROR = "Ownable: caller is not the owner";

    uint8 internal constant NOT_ENTERED = 1;
    uint8 internal constant ENTERED = 2;
    uint8 internal constant PAUSED = 3;

    StargateBaseTestC public stargate;
    address internal creditMessaging;
    address internal tokenMessaging;
    address internal planner;
    address internal feeLib;
    address internal lzToken;
    address internal treasurer;
    uint32 internal localEid;

    function setUp() public virtual {
        stargate = new StargateBaseTestC();

        creditMessaging = address(stargate.getCreditMessaging());
        tokenMessaging = address(stargate.getTokenMessaging());
        planner = stargate.getPlanner();
        feeLib = stargate.getFeeLib();
        lzToken = stargate.getLzToken();
        treasurer = stargate.getTreasurer();
        localEid = stargate.getLocalEid();
    }

    function mockMessagingRideBus(
        bytes32 _mockGuid,
        uint64 _mockNonce,
        uint256 _mockNativeFee,
        uint256 _mockLzTokenFee
    ) public returns (MessagingReceipt memory) {
        MessagingFee memory mockMessagingFee = MessagingFee({ nativeFee: _mockNativeFee, lzTokenFee: _mockLzTokenFee });
        MessagingReceipt memory mockReceipt = MessagingReceipt({
            guid: _mockGuid,
            nonce: _mockNonce,
            fee: mockMessagingFee
        });
        Ticket memory ticket = Ticket({ ticketId: 0, passengerBytes: "" });
        vm.mockCall(
            address(tokenMessaging),
            abi.encodeWithSelector(ITokenMessaging.rideBus.selector),
            abi.encode(mockReceipt, ticket)
        );
        return mockReceipt;
    }

    function mockMessagingRideBus(
        bytes32 _mockGuid,
        uint64 _mockNonce,
        uint256 _mockNativeFee
    ) public returns (MessagingReceipt memory) {
        return mockMessagingRideBus(_mockGuid, _mockNonce, _mockNativeFee, 0);
    }

    function mockMessagingRideBus() internal returns (MessagingReceipt memory) {
        return mockMessagingRideBus(bytes32(uint(1)), 1, 100);
    }

    function mockMessagingTaxi(
        bytes32 _mockGuid,
        uint64 _mockNonce,
        uint256 _mockNativeFee,
        uint256 _mockLzTokenFee
    ) public returns (MessagingReceipt memory) {
        MessagingFee memory mockMessagingFee = MessagingFee({ nativeFee: _mockNativeFee, lzTokenFee: _mockLzTokenFee });
        MessagingReceipt memory mockReceipt = MessagingReceipt({
            guid: _mockGuid,
            nonce: _mockNonce,
            fee: mockMessagingFee
        });
        vm.mockCall(
            address(tokenMessaging),
            abi.encodeWithSelector(ITokenMessaging.taxi.selector),
            abi.encode(mockReceipt)
        );
        return mockReceipt;
    }

    function mockMessagingTaxi(
        bytes32 _mockGuid,
        uint64 _mockNonce,
        uint256 _mockNativeFee
    ) public returns (MessagingReceipt memory) {
        return mockMessagingTaxi(_mockGuid, _mockNonce, _mockNativeFee, 0);
    }

    function mockMessagingTaxi(bytes32 _mockGuid, uint64 _mockNonce) public returns (MessagingReceipt memory) {
        return mockMessagingTaxi(_mockGuid, _mockNonce, 100);
    }

    function mockMessagingTaxi() internal returns (MessagingReceipt memory) {
        return mockMessagingTaxi(bytes32(uint(1)), 1, 100);
    }

    function mockMessagingQuoteTaxi(
        uint256 mockNativeFee,
        uint256 mockLzTokenFee
    ) public returns (MessagingFee memory fee) {
        fee.nativeFee = mockNativeFee;
        fee.lzTokenFee = mockLzTokenFee;
        vm.mockCall(
            address(tokenMessaging),
            abi.encodeWithSelector(ITokenMessaging.quoteTaxi.selector),
            abi.encode(fee)
        );
    }

    function mockMessagingQuoteRideBus(
        uint80 baseBusFare,
        uint16 baseFareMultiplierBps,
        uint256 extraFare
    ) public returns (MessagingFee memory fee) {
        fee = MessagingFee({ nativeFee: 0, lzTokenFee: 0 });
        fee.nativeFee = (baseBusFare * baseFareMultiplierBps) / 10_000;
        fee.nativeFee += extraFare;
        vm.mockCall(
            address(tokenMessaging),
            abi.encodeWithSelector(ITokenMessaging.quoteRideBus.selector),
            abi.encode(fee)
        );
    }

    function mockFeeLibOutput(uint256 _amountInLD) public returns (uint256) {
        return mockFeeLibOutput(_amountInLD, 0);
    }

    function mockFeeLibOutput(uint256 _amountInLD, int16 fee) public returns (uint256 amountOutLD) {
        require(fee < 10000, "fee must be less than 10000");
        amountOutLD = (_amountInLD * uint16((10000 - fee))) / 10000;
        uint64 amountOutSD = _ld2sd(amountOutLD);
        vm.mockCall(feeLib, abi.encodeWithSelector(IStargateFeeLib.applyFeeView.selector), abi.encode(amountOutSD));
        vm.mockCall(feeLib, abi.encodeWithSelector(IStargateFeeLib.applyFee.selector), abi.encode(amountOutSD));
        return _sd2ld(amountOutSD);
    }

    function buildSendParam(
        address _to,
        uint32 _dstEid,
        uint256 _amountLD,
        bytes memory _oftCmd
    ) public pure returns (SendParam memory) {
        return buildSendParam(_to, _dstEid, _amountLD, _amountLD, _oftCmd);
    }

    function buildSendParam(
        address _to,
        uint32 _dstEid,
        uint256 _amountLD,
        uint256 _minAmountLD,
        bytes memory _oftCmd
    ) public pure returns (SendParam memory) {
        return buildSendParam(_to, _dstEid, _amountLD, _minAmountLD, "", 0, _oftCmd);
    }

    function buildSendParam(
        address _to,
        uint32 _dstEid,
        uint256 _amountLD,
        uint256 _minAmountLD,
        bytes memory composeMsg,
        uint128 nativeDrop,
        bytes memory _oftCmd
    ) public pure returns (SendParam memory) {
        bytes memory extraOptions = composeMsg.length > 0
            ? OptionsBuilder.newOptions().addExecutorLzComposeOption(0, 50000, 0)
            : new bytes(0);
        if (nativeDrop > 0 && extraOptions.length == 0) {
            extraOptions = OptionsBuilder.newOptions().addExecutorNativeDropOption(
                nativeDrop,
                AddressCast.toBytes32(_to)
            );
        } else if (nativeDrop > 0) {
            extraOptions = extraOptions.addExecutorNativeDropOption(nativeDrop, AddressCast.toBytes32(_to));
        }
        SendParam memory sendParam = SendParam({
            dstEid: _dstEid,
            to: bytes32(uint256(uint160(_to))),
            amountLD: _amountLD,
            minAmountLD: _minAmountLD,
            extraOptions: extraOptions,
            composeMsg: composeMsg,
            oftCmd: _oftCmd
        });
        return sendParam;
    }

    function _ld2sd(uint256 _amountLD) public view returns (uint64) {
        return stargate.ldToSd(_amountLD);
    }

    function _sd2ld(uint64 _amountSD) public view returns (uint256) {
        return stargate.sdToLd(_amountSD);
    }

    function _setLzToken(address _lzToken) public {
        lzToken = _lzToken;
        stargate.setLzToken(_lzToken);
    }

    function _maxApproveStargatePaymentInLZToken() internal {
        ERC20(lzToken).approve(address(stargate), type(uint256).max);
    }
}

/// @title StargateBaseTestC
/// @notice A test contract for testing StargateBase
contract StargateBaseTestC is StargateBase {
    bool private mockOutflowFail;

    constructor()
        StargateBase(
            address(new PoolToken("Pool Token", "PT")), // token
            18, // token decimals
            6, // share decimals
            LzUtil.deployEndpointV2(1, msg.sender), // endpoint v2
            msg.sender // owner
        )
    {}

    // ---- test utils -----

    function setMockOutflowFail(bool _mockOutflowFail) public {
        mockOutflowFail = _mockOutflowFail;
    }

    // expose internal functions for testing
    function getConvertRate() public view returns (uint256) {
        return convertRate;
    }

    function getFeeLib() public view returns (address) {
        return feeLib;
    }

    function getPlanner() public view returns (address) {
        return planner;
    }

    function getCreditMessaging() public view returns (address) {
        return address(creditMessaging);
    }

    function getTokenMessaging() public view returns (address) {
        return address(tokenMessaging);
    }

    function getTreasurer() public view returns (address) {
        return treasurer;
    }

    function getLzToken() public view returns (address) {
        return lzToken;
    }

    function ldToSd(uint256 _amountLD) public view returns (uint64) {
        return _ld2sd(_amountLD);
    }

    function sdToLd(uint64 _amountSD) public view returns (uint256) {
        return _sd2ld(_amountSD);
    }

    function getCredit(uint32 _eid) public view returns (uint64) {
        return paths[_eid].credit;
    }

    function getLocalEid() public view returns (uint32) {
        return localEid;
    }

    function getBusFare(uint32 _eid) public view returns (uint256) {
        //        return paths[_eid].busFare;
    }

    function increaseCredit(uint32 _eid, uint64 _amountSD) public {
        paths[_eid].increaseCredit(_amountSD);
    }

    function setLzToken(address _lzToken) public {
        lzToken = _lzToken;
    }

    // ---- override virtual functions -----

    function _inflow(address /*_from*/, uint256 _amountLD) internal view override returns (uint64 amountSD) {
        amountSD = _ld2sd(_amountLD);
    }

    function _outflow(address /*_to*/, uint256 /*_amountLD*/) internal view override returns (bool success) {
        success = !mockOutflowFail;
    }

    function _capReward(
        uint64 _amountOutSD,
        uint64 _reward
    ) internal pure override returns (uint64 newAmountOutSD, uint64 newReward) {
        newAmountOutSD = _amountOutSD;
        newReward = _reward;
    }

    function stargateType() external pure returns (StargateType) {
        return StargateType.Pool;
    }

    function _buildFeeParams(
        uint32 _dstEid,
        uint64 _amountInSD,
        bool _isTaxi
    ) internal view override returns (FeeParams memory) {
        return FeeParams(msg.sender, _dstEid, _amountInSD, 0, paths[_dstEid].isOFTPath(), _isTaxi);
    }
}

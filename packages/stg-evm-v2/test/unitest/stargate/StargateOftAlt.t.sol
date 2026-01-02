// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import { LPToken } from "../../../src/utils/LPToken.sol";
import { ERC20Token } from "../../../src/mocks/ERC20Token.sol";
import { AltFeeTokenMock } from "../../layerzero/mocks/AltFeeTokenMock.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { SendParam, MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OftCmdHelper } from "../../utils/OftCmdHelper.sol";
import { ITokenMessaging } from "../../../src/interfaces/ITokenMessaging.sol";
import { IStargateFeeLib } from "../../../src/interfaces/IStargateFeeLib.sol";
import { Path } from "../../../src/libs/Path.sol";
import { TokenMessaging } from "../../../src/messaging/TokenMessaging.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { StargateOFTAlt } from "../../../src/StargateOFTAlt.sol";
import { IStargate } from "../../../src/interfaces/IStargate.sol";

contract StargateOftAltTest is Test {
    address internal ALICE = makeAddr("alice");
    uint32 internal constant DST_EID = 1;
    uint32 internal constant LOCAL_EID = 2;

    IMockStargate public stargate;
    ERC20Token public token;
    AltFeeTokenMock public feeToken;

    function _labelAddresses() internal {
        vm.label(ALICE, "ALICE");
    }

    function setUp() public {
        _setUpStargate();
        _labelAddresses();
        _configureTokenMessaging();
    }

    function _setUpStargate() internal virtual {
        token = new ERC20Token("Mock", "MCK", 6);
        feeToken = new AltFeeTokenMock();
        stargate = new MockStargateOFTAlt(
            address(token),
            6, // shared decimals
            LzUtil.deployEndpointV2Alt(LOCAL_EID, address(this), address(feeToken)),
            address(this) // owner
        );
    }

    function _configureTokenMessaging() internal {
        uint16 assetId = 1;
        address tokenMessaging = stargate.getTokenMessaging();
        vm.prank(address(stargate));
        TokenMessaging(tokenMessaging).setAssetId(address(stargate), assetId);
        vm.prank(address(stargate));
        TokenMessaging(tokenMessaging).setGasLimit(DST_EID, 100000, 110000);
        vm.prank(address(stargate));
        TokenMessaging(tokenMessaging).setPeer(DST_EID, AddressCast.toBytes32(tokenMessaging));
        vm.prank(address(stargate));
        TokenMessaging(tokenMessaging).setPlanner(address(this));
        stargate.ensureCredit(DST_EID, 1_000_000); // give plenty of credit
    }

    function test_RevertIf_NonAltEndpoint() public {
        address endpoint = LzUtil.deployEndpointV2(2, address(this));
        vm.expectRevert(StargateOFTAlt.Stargate_NotAnAltEndpoint.selector);
        new MockStargateOFTAlt(
            address(token),
            6,
            endpoint, // non-ALT endpoint
            address(this)
        );
    }

    function test_RevertIf_BusMode() public {
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: AddressCast.toBytes32(ALICE),
            amountLD: 1,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.bus() // triggers _isTaxiMode revert
        });
        vm.expectRevert(StargateOFTAlt.Stargate_BusNotAllowedInAlt.selector);
        stargate.send(sendParam, MessagingFee(0, 0), ALICE);
    }

    function test_QuoteSend_RevertsOnBus() public {
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: AddressCast.toBytes32(ALICE),
            amountLD: 1,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.bus()
        });
        vm.expectRevert(StargateOFTAlt.Stargate_BusNotAllowedInAlt.selector);
        stargate.quoteSend(sendParam, false);
    }

    function test_QuoteOFT_RevertsOnBus() public {
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: AddressCast.toBytes32(ALICE),
            amountLD: 1,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.bus()
        });
        vm.expectRevert(StargateOFTAlt.Stargate_BusNotAllowedInAlt.selector);
        stargate.quoteOFT(sendParam);
    }

    function test_RevertIf_SendsEthForFees() public {
        _mockFeeLibOutput(stargate.sdToLd(10)); // allow fee lib to succeed
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: AddressCast.toBytes32(ALICE),
            amountLD: 10,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.taxi()
        });
        _deal(ALICE, 10, 1);
        _approveAndPrank(ALICE);

        vm.expectRevert(StargateOFTAlt.Stargate_OnlyAltToken.selector);
        stargate.send{ value: 1 }(sendParam, MessagingFee(0, 0), ALICE);
    }

    function test_Taxi_UsesAltFeeTokenAndZeroMsgValue() public {
        uint256 nativeFee = 123;
        _mockFeeLibOutput(stargate.sdToLd(10));
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: AddressCast.toBytes32(ALICE),
            amountLD: 10,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.taxi()
        });
        MessagingReceipt memory receipt = _mockEndpointSend(nativeFee);

        _deal(ALICE, 10, 0);
        _approveAndPrank(ALICE);

        feeToken.mint(ALICE, nativeFee);
        vm.prank(ALICE);
        feeToken.approve(address(stargate), nativeFee);

        uint256 aliceEthBefore = ALICE.balance;

        vm.prank(ALICE);
        stargate.send(sendParam, MessagingFee(nativeFee, receipt.fee.lzTokenFee), ALICE);

        assertEq(feeToken.balanceOf(address(stargate.getEndpoint())), nativeFee, "fee token funded endpoint");
        assertEq(ALICE.balance, aliceEthBefore, "no ETH charged");
    }

    // ---------------------------------------------------------------------
    // Helpers

    function _mockEndpointSend(uint256 _mockNativeFee) internal returns (MessagingReceipt memory) {
        MessagingFee memory mockMessagingFee = MessagingFee({ nativeFee: _mockNativeFee, lzTokenFee: 0 });
        MessagingReceipt memory mockReceipt = MessagingReceipt({ guid: "0", nonce: 1, fee: mockMessagingFee });
        vm.mockCall(
            address(TokenMessaging(stargate.getTokenMessaging()).endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.send.selector),
            abi.encode(mockReceipt)
        );
        return mockReceipt;
    }

    function _mockFeeLibOutput(uint256 _amountOutLD) internal {
        uint64 amountOutSD = stargate.ldToSd(_amountOutLD);
        address feeLib = stargate.getFeeLib();
        vm.mockCall(feeLib, abi.encodeWithSelector(IStargateFeeLib.applyFeeView.selector), abi.encode(amountOutSD));
        vm.mockCall(feeLib, abi.encodeWithSelector(IStargateFeeLib.applyFee.selector), abi.encode(amountOutSD));
    }

    function _deal(address _to, uint256 _amountLD, uint256 _feeNative) internal {
        token.transfer(_to, _amountLD);
        if (_feeNative > 0) vm.deal(_to, _feeNative);
    }

    function _approveAndPrank(address _account) internal {
        vm.prank(_account);
        token.approve(address(stargate), type(uint256).max);
        vm.prank(_account);
    }
}

interface IMockStargate is IStargate {
    function getTokenMessaging() external view returns (address);

    function getFeeLib() external view returns (address);

    function ldToSd(uint256 _amountLD) external view returns (uint64);

    function sdToLd(uint64 _amountSD) external view returns (uint256);

    function getPaths(uint32 _eid) external view returns (Path memory);

    function ensureCredit(uint32 _eid, uint64 _amountSD) external;

    function getEndpoint() external view returns (address);
}

contract MockStargateOFTAlt is IMockStargate, StargateOFTAlt {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFTAlt(_token, _sharedDecimals, _endpoint, _owner) {
        tokenMessaging = address(new TokenMessaging(_endpoint, _owner, 128));
        planner = _owner;
    }

    function getTokenMessaging() public view returns (address) {
        return tokenMessaging;
    }

    function getFeeLib() public view returns (address) {
        return feeLib;
    }

    function ldToSd(uint256 _amountLD) public view returns (uint64) {
        return _ld2sd(_amountLD);
    }

    function sdToLd(uint64 _amountSD) public view returns (uint256) {
        return _sd2ld(_amountSD);
    }

    function getPaths(uint32 _eid) public view override returns (Path memory) {
        return paths[_eid];
    }

    function ensureCredit(uint32 _eid, uint64 _amountSD) public override {
        Path storage path = paths[_eid];
        path.credit = _amountSD;
    }

    function getEndpoint() external view returns (address) {
        return address(endpoint);
    }
}

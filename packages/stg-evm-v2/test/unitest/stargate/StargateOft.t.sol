// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { LPToken } from "../../../src/utils/LPToken.sol";
import { ERC20Token } from "../../../src/mocks/ERC20Token.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { SendParam, MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OftCmdHelper } from "../../utils/OftCmdHelper.sol";
import { ITokenMessaging } from "../../../src/interfaces/ITokenMessaging.sol";
import { IStargateFeeLib } from "../../../src/interfaces/IStargateFeeLib.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { Path } from "../../../src/libs/Path.sol";
import { TokenMessaging } from "../../../src/messaging/TokenMessaging.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";
import { StargateOFT } from "../../../src/StargateOFT.sol";
import { IStargate } from "../../../src/interfaces/IStargate.sol";

contract StargateOftTest is Test {
    bytes internal constant EXCEEDS_BALANCE = "ERC20: burn amount exceeds balance";
    address internal constant ALICE = address(0xace);
    uint32 internal constant DST_EID = 1;
    uint32 internal constant LOCAL_EID = 2;
    uint80 internal constant FARE = 100_000;
    uint80 internal constant NATIVE_DROP_FARE = 140_000;
    IMockStargate public stargate;
    ERC20Token public token;

    function _labelAddresses() internal {
        vm.label(ALICE, "ALICE");
    }

    function setUp() public {
        _setUpStargate();
        _labelAddresses();
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
        vm.prank(address(this));
        TokenMessaging(tokenMessaging).setFares(DST_EID, FARE, NATIVE_DROP_FARE);
    }

    function _setUpStargate() internal virtual {
        token = new ERC20Token("Mock", "MCK", 6);
        stargate = new MockStargateOFT(
            address(token),
            6, // share decimals
            LzUtil.deployEndpointV2(LOCAL_EID, address(this)), // endpoint v2
            address(this) // owner
        );
    }

    function test_Taxi() public {
        _test_sendToken(1000, 0, true);
    }

    function test_TaxiWithFee() public {
        _test_sendToken(1000, 100, true);
    }

    function test_TaxiWithReward() public {
        _test_sendToken(1000, -100, true);
    }

    function test_RideBus() public {
        _test_sendToken(1000, 0, false);
    }

    function test_RideBusWithFee() public {
        _test_sendToken(1000, 100, false);
    }

    function _test_sendToken(uint64 _amountSD, int16 _feeRate, bool isTaxi) internal {
        uint64 beforeTreasuryFee = StargateBase(address(stargate)).treasuryFee();
        uint64 amountSD = _amountSD;
        uint256 amountLD = stargate.sdToLd(amountSD);
        stargate.ensureCredit(DST_EID, amountSD);
        uint64 beforeCredit = stargate.getPaths(DST_EID).credit;
        bytes32 to = AddressCast.toBytes32(ALICE);
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: to,
            amountLD: amountLD,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: "",
            oftCmd: isTaxi ? OftCmdHelper.taxi() : OftCmdHelper.bus()
        });
        uint256 mockFee = FARE;
        MessagingReceipt memory receipt = mockEndpointSend(mockFee);
        uint256 amountOutLD = mockFeeLibOutput(amountLD, _feeRate);
        uint64 amountOutSD = stargate.ldToSd(amountOutLD);
        uint64 sendSD = amountOutSD > amountSD ? amountSD : amountOutSD; // should not have reward
        _deal(ALICE, amountLD, receipt.fee.nativeFee);
        _approveAndPrank(ALICE);
        stargate.send{ value: _getValue(amountLD, receipt.fee.nativeFee) }(sendParam, receipt.fee, ALICE);

        assertEq(_balanceOf(address(stargate)), 0);
        assertEq(address(ALICE).balance, 0);
        assertDstCreditEq(beforeCredit - sendSD);
        assertLocalCreditEq(0);
        assertTreasuryFeeEq(beforeTreasuryFee + amountSD - sendSD);
    }

    receive() external payable {}

    function assertDstCreditEq(uint64 _credit) public {
        Path memory path = stargate.getPaths(DST_EID);
        assertEq(path.credit, _credit);
    }

    function assertLocalCreditEq(uint64 _credit) public {
        Path memory path = stargate.getPaths(LOCAL_EID);
        assertEq(path.credit, _credit);
    }

    function assertTreasuryFeeEq(uint64 _fee) public {
        assertEq(StargateBase(address(stargate)).treasuryFee(), _fee);
    }

    function mockEndpointSend(uint256 _mockNativeFee) internal returns (MessagingReceipt memory) {
        return mockEndpointSend(bytes32(uint(1)), 1, _mockNativeFee, 0);
    }

    function mockEndpointSend() internal returns (MessagingReceipt memory) {
        return mockEndpointSend(bytes32(uint(1)), 1, 0, 0);
    }

    function mockEndpointSend(
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
            address(TokenMessaging(stargate.getTokenMessaging()).endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.send.selector),
            abi.encode(mockReceipt)
        );
        return mockReceipt;
    }

    function mockFeeLibOutput(uint256 _amountInLD) public returns (uint256) {
        return mockFeeLibOutput(_amountInLD, 0);
    }

    function mockFeeLibOutput(uint256 _amountInLD, int16 fee) public returns (uint256 amountOutLD) {
        require(fee < 10000, "fee must be less than 10000");
        amountOutLD = (_amountInLD * uint16((10000 - fee))) / 10000;
        uint64 amountOutSD = stargate.ldToSd(amountOutLD);
        address feeLib = stargate.getFeeLib();
        vm.mockCall(feeLib, abi.encodeWithSelector(IStargateFeeLib.applyFeeView.selector), abi.encode(amountOutSD));
        vm.mockCall(feeLib, abi.encodeWithSelector(IStargateFeeLib.applyFee.selector), abi.encode(amountOutSD));
        return stargate.sdToLd(amountOutSD);
    }

    function _deal(address _to, uint256 _amount) internal {
        _deal(_to, _amount, 0);
    }

    function _deal(address _to, uint256 _amount, uint256 _fee) internal virtual {
        token.transfer(_to, _amount);
        if (_fee > 0) vm.deal(_to, _fee);
    }

    function _balanceOf(address _account) internal view virtual returns (uint256) {
        return token.balanceOf(_account);
    }

    function _approveAndPrank(address _account, address _spender) internal virtual {
        vm.prank(_account);
        token.approve(_spender, type(uint256).max);
        vm.prank(_account);
    }

    function _approveAndPrank(address _account) internal {
        _approveAndPrank(_account, address(stargate));
    }

    function _getValue(uint256 /*_value*/, uint256 _fee) internal pure virtual returns (uint256) {
        return _fee;
    }

    function _getValue(uint256 _value) internal pure virtual returns (uint256) {
        return _getValue(_value, 0);
    }
}

interface IMockStargate is IStargate {
    function getTokenMessaging() external view returns (address);
    function getFeeLib() external view returns (address);
    function ldToSd(uint256 _amountLD) external view returns (uint64);
    function sdToLd(uint64 _amountSD) external view returns (uint256);
    function getPaths(uint32 _eid) external view returns (Path memory);
    function ensureCredit(uint32 _eid, uint64 _amountSD) external;
}

contract MockStargateOFT is IMockStargate, StargateOFT {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFT(_token, _sharedDecimals, _endpoint, _owner) {
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
}

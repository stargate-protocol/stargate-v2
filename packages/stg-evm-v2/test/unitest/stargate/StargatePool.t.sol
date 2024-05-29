// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { StargateType } from "../../../src/interfaces/IStargate.sol";
import { StargatePool, IStargatePool } from "../../../src/StargatePool.sol";
import { LPToken } from "../../../src/utils/LPToken.sol";
import { ERC20Token } from "../../../src/mocks/ERC20Token.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { SendParam, MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OftCmdHelper } from "../../utils/OftCmdHelper.sol";
import { ITokenMessaging } from "../../../src/interfaces/ITokenMessaging.sol";
import { IStargateFeeLib } from "../../../src/interfaces/IStargateFeeLib.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { Path, PathLib } from "../../../src/libs/Path.sol";
import { TokenMessaging } from "../../../src/messaging/TokenMessaging.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";

contract StargatePoolTest is Test {
    bytes constant EXCEEDS_BALANCE = "ERC20: burn amount exceeds balance";
    address constant ALICE = address(0xace);
    uint32 constant DST_EID = 1;
    uint32 constant LOCAL_EID = 2;
    uint80 constant BUS_FARE = 100000;
    uint80 constant NATIVE_DROP_FARE = 200000;
    uint128 constant GAS_LIMIT = 100000;
    uint128 constant NATIVE_DROP_GAS_LIMIT = 50000;
    IMockStargatePool public stargate;
    LPToken public lpToken;
    ERC20Token public token;
    bool internal isNativePool;

    function _assumeAmountSD(uint64 _amountSD) internal view returns (uint256) {
        return _assumeAmountSD(_amountSD, 1);
    }

    function _assumeAmountSD(uint64 _amountSD, uint64 _minAmountSD) internal view returns (uint256) {
        vm.assume(_amountSD >= _minAmountSD);
        return stargate.sdToLd(_amountSD);
    }

    function setUp() public {
        _setUpStargate();
        uint16 assetId = 1;
        address tokenMessaging = stargate.getTokenMessaging();
        vm.prank(address(stargate));
        TokenMessaging(tokenMessaging).setAssetId(address(stargate), assetId);
        vm.prank(address(stargate));
        TokenMessaging(tokenMessaging).setGasLimit(DST_EID, GAS_LIMIT, NATIVE_DROP_GAS_LIMIT);
        vm.prank(address(stargate));
        TokenMessaging(tokenMessaging).setPeer(DST_EID, AddressCast.toBytes32(tokenMessaging));
        vm.prank(address(stargate));
        TokenMessaging(tokenMessaging).setPlanner(address(this));
        vm.prank(address(this));
        TokenMessaging(tokenMessaging).setFares(DST_EID, BUS_FARE, NATIVE_DROP_FARE);
    }

    function _setUpStargate() internal virtual {
        token = new ERC20Token("Mock", "MCK", 6);
        stargate = new MockStargatePool(
            "LP Name",
            "LP",
            address(token),
            18,
            6, // share decimals
            LzUtil.deployEndpointV2(LOCAL_EID, address(this)), // endpoint v2
            address(this) // owner
        );
        lpToken = LPToken(stargate.lpToken());
    }

    function test_Treasury() public virtual {
        uint64 amountSD = 1000;
        StargatePool pool = StargatePool(address(stargate));
        uint256 amountLD = stargate.sdToLd(amountSD);
        address treasurer = address(this);
        uint256 beforeBalance = _balanceOf(treasurer);
        _approveAndPrank(treasurer);
        vm.expectEmit();
        emit StargateBase.TreasuryFeeAdded(amountSD);
        pool.addTreasuryFee{ value: _getValue(amountLD) }(amountLD);

        assertEq(_balanceOf(address(stargate)), amountLD);
        assertEq(_balanceOf(treasurer), beforeBalance - amountLD);
        assertEq(pool.treasuryFee(), amountSD);

        _approveAndPrank(treasurer);
        vm.expectEmit();
        emit StargateBase.TreasuryFeeWithdrawn(ALICE, amountSD);
        pool.withdrawTreasuryFee(ALICE, amountSD);

        assertEq(_balanceOf(address(stargate)), 0);
        assertEq(_balanceOf(ALICE), amountLD);
        assertEq(pool.treasuryFee(), 0);
    }

    function test_Deposit() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        uint256 beforeBalance = _balanceOf(ALICE);
        _approveAndPrank(ALICE);
        vm.expectEmit();
        emit StargatePool.Deposited(ALICE, ALICE, amountLD);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);

        assertEq(_balanceOf(address(stargate)), amountLD);
        assertEq(lpToken.balanceOf(ALICE), amountLD);
        assertEq(_balanceOf(ALICE), beforeBalance - amountLD);
        assertLocalCreditEq(amountSD);
        assertEq(stargate.tvl(), amountLD);
    }

    function test_Redeem() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        uint256 beforeBalance = _balanceOf(ALICE);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);

        _approveAndPrank(ALICE);
        vm.expectEmit();
        emit StargatePool.Redeemed(ALICE, ALICE, amountLD);
        stargate.redeem(amountLD, ALICE);

        assertEq(_balanceOf(address(stargate)), 0);
        assertEq(lpToken.balanceOf(ALICE), 0);
        assertEq(_balanceOf(ALICE), beforeBalance);
        assertLocalCreditEq(0);
        assertEq(stargate.tvl(), 0);
    }

    function test_RedeemWithDust() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        uint256 beforeBalance = _balanceOf(ALICE);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);
        _approveAndPrank(ALICE);
        vm.expectEmit();
        emit StargatePool.Redeemed(ALICE, ALICE, amountLD);
        stargate.redeem(amountLD + 1, ALICE);

        assertEq(_balanceOf(address(stargate)), 0);
        assertEq(lpToken.balanceOf(ALICE), 0);
        assertEq(_balanceOf(ALICE), beforeBalance);
        assertLocalCreditEq(0);
        assertEq(stargate.tvl(), 0);
    }

    function test_RevertIf_RedeemTooMuch() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);
        _approveAndPrank(ALICE);
        uint256 exceedsAmountLD = stargate.sdToLd(amountSD + 1);
        vm.expectRevert(PathLib.Path_InsufficientCredit.selector);
        stargate.redeem(exceedsAmountLD, ALICE);

        assertEq(_balanceOf(address(stargate)), amountLD);
        assertEq(lpToken.balanceOf(ALICE), amountLD);
        assertEq(_balanceOf(ALICE), 0);
        assertLocalCreditEq(amountSD);
    }

    function test_RevertIf_RedeemSendWithBus() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);
        bytes32 to = AddressCast.toBytes32(ALICE);
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: to,
            amountLD: amountLD,
            minAmountLD: amountLD,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.bus()
        });
        _approveAndPrank(ALICE);
        vm.expectRevert(StargatePool.Stargate_OnlyTaxi.selector);
        stargate.redeemSend(sendParam, MessagingFee(0, 0), ALICE);

        assertEq(_balanceOf(address(stargate)), amountLD);
        assertEq(lpToken.balanceOf(ALICE), amountLD);
        assertEq(_balanceOf(ALICE), 0);
        assertLocalCreditEq(amountSD);
    }

    function test_RevertIf_RedeemSendFeeNotEnough() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        stargate.ensureCredit(DST_EID, amountSD);
        uint256 mockFee = 100;
        _deal(ALICE, amountLD, mockFee);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);
        bytes32 to = AddressCast.toBytes32(ALICE);
        mockEndpointSend(bytes32(uint(1)), 1, mockFee, 0);
        mockFeeLibOutput(amountLD);
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: to,
            amountLD: amountLD,
            minAmountLD: amountLD,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.taxi()
        });
        _approveAndPrank(ALICE);
        vm.expectRevert(StargateBase.Stargate_InvalidAmount.selector);
        stargate.redeemSend{ value: _getValue(0, mockFee - 1) }(sendParam, MessagingFee(mockFee, 0), ALICE);

        assertLocalCreditEq(amountSD);
        assertEq(lpToken.balanceOf(ALICE), amountLD);
    }

    function test_RevertIf_RedeemSendTooMuch() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        uint256 mockFee = 100;
        _deal(ALICE, amountLD, mockFee);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);
        bytes32 to = AddressCast.toBytes32(ALICE);
        mockEndpointSend(bytes32(uint(1)), 1, mockFee, 0);
        mockFeeLibOutput(amountLD);
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: to,
            amountLD: stargate.sdToLd(amountSD + 1), // too much
            minAmountLD: amountLD,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.taxi()
        });
        _approveAndPrank(ALICE);
        vm.expectRevert(EXCEEDS_BALANCE);
        stargate.redeemSend{ value: _getValue(0, mockFee) }(sendParam, MessagingFee(mockFee, 0), ALICE);
        assertLocalCreditEq(amountSD);
        assertEq(lpToken.balanceOf(ALICE), amountLD);
    }

    function test_RevertIf_RedeemSendSlippageTooHigh() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        uint256 mockFee = 100;
        _deal(ALICE, amountLD, mockFee);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);
        bytes32 to = AddressCast.toBytes32(ALICE);
        mockEndpointSend(bytes32(uint(1)), 1, mockFee, 0);
        mockFeeLibOutput(amountLD, 1);
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: to,
            amountLD: amountLD,
            minAmountLD: amountLD,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.taxi()
        });
        _approveAndPrank(ALICE);
        vm.expectRevert(StargateBase.Stargate_SlippageTooHigh.selector);
        stargate.redeemSend{ value: _getValue(0, mockFee) }(sendParam, MessagingFee(mockFee, 0), ALICE);
        assertLocalCreditEq(amountSD);
        assertEq(lpToken.balanceOf(ALICE), amountLD);
    }

    function test_RevertIf_RedeemSendLessThan1SD() public {
        uint64 amountSD = 1;
        uint256 amountLD = stargate.sdToLd(amountSD);
        uint256 mockFee = 100;
        _deal(ALICE, amountLD, mockFee);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);
        bytes32 to = AddressCast.toBytes32(ALICE);
        mockEndpointSend(bytes32(uint(1)), 1, mockFee, 0);
        mockFeeLibOutput(amountLD, 1);
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: to,
            amountLD: 1,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: "",
            oftCmd: OftCmdHelper.taxi()
        });
        _approveAndPrank(ALICE);
        vm.expectRevert(StargateBase.Stargate_SlippageTooHigh.selector);
        stargate.redeemSend{ value: _getValue(0, mockFee) }(sendParam, MessagingFee(mockFee, 0), ALICE);
        assertLocalCreditEq(amountSD);
        assertEq(lpToken.balanceOf(ALICE), amountLD);
    }

    function test_RedeemSend() public {
        _test_redeemSend(1000, 0, 0);
    }

    function test_RedeemSendWithDust() public {
        _test_redeemSend(1000, 0, 1);
    }

    function test_RedeemSendWithFee() public {
        _test_redeemSend(1000, 100, 0);
    }

    function test_Taxi() public {
        _test_sendToken(1000, 100, true);
    }

    function test_TaxiWithReward() public {
        _approveAndPrank(address(this));
        uint256 treasuryFeeLD = stargate.sdToLd(20);
        StargatePool(address(stargate)).addTreasuryFee{ value: _getValue(treasuryFeeLD) }(treasuryFeeLD);
        _test_sendToken(1000, -100, true);
    }

    function test_TaxiWithRewardCapped() public {
        _approveAndPrank(address(this));
        uint256 treasuryFeeLD = stargate.sdToLd(3); // reward should be 10, but only 3 treasury
        StargatePool(address(stargate)).addTreasuryFee{ value: _getValue(treasuryFeeLD) }(treasuryFeeLD);
        _test_sendToken(1000, -100, true);
    }

    function test_RideBus() public {
        _test_sendToken(1000, 100, false);
    }

    function test_RideBusWithReward() public {
        _approveAndPrank(address(this));
        uint256 treasuryFeeLD = stargate.sdToLd(20);
        StargatePool(address(stargate)).addTreasuryFee{ value: _getValue(treasuryFeeLD) }(treasuryFeeLD);
        _test_sendToken(1000, -100, false);
    }

    function test_RideBusWithRewardCapped() public {
        _approveAndPrank(address(this));
        uint256 treasuryFeeLD = stargate.sdToLd(2); // reward should be 10, but only 2 treasury
        StargatePool(address(stargate)).addTreasuryFee{ value: _getValue(treasuryFeeLD) }(treasuryFeeLD);
        _test_sendToken(1000, -100, false);
    }

    function _test_redeemSend(uint64 _amountSD, int16 _feeRate, uint256 _dust) internal {
        uint64 beforeTreasuryFee = StargatePool(address(stargate)).treasuryFee();
        uint64 amountSD = _amountSD;
        uint256 amountLD = stargate.sdToLd(amountSD);
        uint256 mockFee = 100;
        stargate.ensureCredit(DST_EID, _amountSD * 2);
        uint64 beforeCredit = stargate.getPaths(DST_EID).credit;
        _deal(ALICE, amountLD, mockFee);
        _approveAndPrank(ALICE);
        stargate.deposit{ value: _getValue(amountLD) }(ALICE, amountLD);
        uint256 afterDepositBalance = _balanceOf(address(stargate));
        bytes32 to = AddressCast.toBytes32(ALICE);
        mockEndpointSend(bytes32(uint(1)), 1, mockFee, 0);
        uint256 amountOutLD = mockFeeLibOutput(amountLD, _feeRate);
        uint64 amountOutSD = stargate.ldToSd(amountOutLD);
        uint64 sendSD = amountOutSD > _amountSD + beforeTreasuryFee ? _amountSD + beforeTreasuryFee : amountOutSD;
        _approveAndPrank(ALICE);
        stargate.redeemSend{ value: _getValue(0, mockFee) }(
            SendParam({
                dstEid: DST_EID,
                to: to,
                amountLD: amountLD + _dust,
                minAmountLD: 0,
                extraOptions: "",
                composeMsg: "",
                oftCmd: OftCmdHelper.taxi()
            }),
            MessagingFee(mockFee, 0),
            ALICE
        );

        assertEq(_balanceOf(address(stargate)), afterDepositBalance);
        assertEq(lpToken.balanceOf(ALICE), 0);
        assertEq(address(ALICE).balance, 0);
        assertLocalCreditEq(sendSD);
        assertDstCreditEq(beforeCredit - sendSD);
        assertEq(stargate.tvl(), 0);
    }

    function _test_sendToken(uint64 _amountSD, int16 _feeRate, bool isTaxi) internal {
        uint64 beforeTreasuryFee = StargatePool(address(stargate)).treasuryFee();
        uint256 beforeTvl = stargate.tvl();
        uint256 amountLD = stargate.sdToLd(_amountSD);
        stargate.ensureCredit(DST_EID, _amountSD * 2);
        uint64 beforeCredit = stargate.getPaths(DST_EID).credit;
        SendParam memory sendParam = SendParam({
            dstEid: DST_EID,
            to: AddressCast.toBytes32(ALICE),
            amountLD: amountLD,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: "",
            oftCmd: isTaxi ? OftCmdHelper.taxi() : OftCmdHelper.bus()
        });
        MessagingReceipt memory receipt = mockEndpointSend(BUS_FARE);
        uint256 amountOutLD = mockFeeLibOutput(amountLD, _feeRate);
        uint64 amountOutSD = stargate.ldToSd(amountOutLD);
        uint64 sendSD = amountOutSD > _amountSD + beforeTreasuryFee ? _amountSD + beforeTreasuryFee : amountOutSD;
        _deal(ALICE, amountLD, receipt.fee.nativeFee);
        _approveAndPrank(ALICE);
        (MessagingReceipt memory msgReceipt, ) = stargate.send{ value: _getValue(amountLD, receipt.fee.nativeFee) }(
            sendParam,
            receipt.fee,
            ALICE
        );
        assertEq(
            _balanceOf(address(stargate)),
            isNativePool && !isTaxi
                ? amountLD + stargate.sdToLd(beforeTreasuryFee) + msgReceipt.fee.nativeFee
                : amountLD + stargate.sdToLd(beforeTreasuryFee)
        );
        assertEq(lpToken.balanceOf(address(stargate)), 0);
        assertEq(address(ALICE).balance, 0);
        assertDstCreditEq(beforeCredit - sendSD);
        assertLocalCreditEq(sendSD);
        assertTreasuryFeeEq(beforeTreasuryFee + _amountSD - sendSD);
        assertEq(beforeTvl, stargate.tvl());
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
        assertEq(StargatePool(address(stargate)).treasuryFee(), _fee);
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
        //        vm.mockCall(stargate.getTokenMessaging(), _mockNativeFee, abi.encodeWithSelector(ITokenMessaging.taxi.selector), abi.encode(mockReceipt));
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

    function test_stargateType() public {
        assertEq(uint256(stargate.stargateType()), uint256(StargateType.Pool));
    }
}

interface IMockStargatePool is IStargatePool {
    function getTokenMessaging() external view returns (address);
    function getFeeLib() external view returns (address);
    function ldToSd(uint256 _amountLD) external view returns (uint64);
    function sdToLd(uint64 _amountSD) external view returns (uint256);
    function getPaths(uint32 _eid) external view returns (Path memory);
    function ensureCredit(uint32 _eid, uint64 _amountSD) external;
}

contract MockStargatePool is StargatePool, IMockStargatePool {
    uint16 public constant QUEUE_CAPACITY = 512;

    constructor(
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        address _token,
        uint8 _tokenDecimals,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargatePool(_lpTokenName, _lpTokenSymbol, _token, _tokenDecimals, _sharedDecimals, _endpoint, _owner) {
        tokenMessaging = address(new TokenMessaging(_endpoint, _owner, QUEUE_CAPACITY));
        planner = _owner;
        treasurer = _owner;
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

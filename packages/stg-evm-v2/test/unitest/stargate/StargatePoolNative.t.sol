// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { StargatePoolNative } from "../../../src/StargatePoolNative.sol";
import { StargatePool } from "../../../src/StargatePool.sol";
import { LPToken } from "../../../src/utils/LPToken.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { SendParam, MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OftCmdHelper } from "../../utils/OftCmdHelper.sol";
import { ITokenMessaging } from "../../../src/interfaces/ITokenMessaging.sol";
import { IStargateFeeLib } from "../../../src/interfaces/IStargateFeeLib.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { StargatePoolTest, IMockStargatePool } from "./StargatePool.t.sol";
import { Path } from "../../../src/libs/Path.sol";
import { TokenMessaging } from "../../../src/messaging/TokenMessaging.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";

contract StargatePoolNativeTest is StargatePoolTest {
    string internal constant LP_NAME = "LP Name";
    string internal constant LP_SYMBOL = "LP";
    uint8 internal constant LD = 18;
    uint8 internal constant SD = 6;

    function _setUpStargate() internal override {
        stargate = new MockStargatePoolNative(
            LP_NAME,
            LP_SYMBOL,
            LD,
            SD,
            LzUtil.deployEndpointV2(LOCAL_EID, address(this)), // endpoint v2
            address(this) // owner
        );
        lpToken = LPToken(stargate.lpToken());
        isNativePool = true;
    }

    function test_RevertIf_DepositWrongValue(uint64 _amountInSD, uint8 _diffLD) public {
        // 1. Ensure _diffLD < amountLD to prevent underflow
        uint256 amountInLD = _assumeAmountSD(_amountInSD);
        vm.assume(_diffLD > 0 && _diffLD < amountInLD);

        // 2. Deal ALICE the funds and max approve.
        _deal(ALICE, amountInLD + _diffLD);
        _approveAndPrank(ALICE);

        // 3. Ensure ALICE cannot deposit too little value
        vm.expectRevert(StargateBase.Stargate_InvalidAmount.selector);
        stargate.deposit{ value: _getValue(amountInLD - _diffLD) }(ALICE, amountInLD);
        assertDstCreditEq(0);
        assertEq(lpToken.balanceOf(ALICE), 0);

        _approveAndPrank(ALICE);

        // 4. Ensure ALICE cannot deposit too much value
        vm.expectRevert(StargateBase.Stargate_InvalidAmount.selector);
        stargate.deposit{ value: _getValue(amountInLD + _diffLD) }(ALICE, amountInLD);
        assertDstCreditEq(0);
        assertEq(lpToken.balanceOf(ALICE), 0);
    }

    /// @dev Ensure that only the owner can send native coin to the pool.
    function test_depositNativeEth(uint256 _amountLD) public {
        // 1. Ensure ALICE cannot send native coin to the pool
        _deal(ALICE, _amountLD);
        uint256 aliceBalanceBefore = ALICE.balance;
        vm.prank(ALICE);
        (bool success, ) = payable(address(stargate)).call{ value: _amountLD }("");
        assertFalse(success);
        assertEq(0, address(stargate).balance);
        assertEq(aliceBalanceBefore, ALICE.balance);

        // 2. Ensure owner can send native coin to the pool
        address owner = Ownable(address(stargate)).owner();
        _deal(owner, _amountLD);
        uint256 ownerBalanceBefore = owner.balance;
        vm.prank(owner);
        (success, ) = payable(address(stargate)).call{ value: _amountLD }("");
        assertTrue(success);
        assertEq(_amountLD, address(stargate).balance);
        assertEq(ownerBalanceBefore - _amountLD, owner.balance);
    }

    function _deal(address _to, uint256 _amount, uint256 _fee) internal override {
        vm.deal(_to, _amount + _fee);
    }

    function _balanceOf(address _account) internal view override returns (uint256) {
        return _account.balance;
    }

    function _approveAndPrank(address _account, address /*_spender*/) internal override {
        vm.prank(_account);
    }

    function _getValue(uint256 _value, uint256 _fee) internal pure override returns (uint256) {
        return _value + _fee;
    }
}

contract MockStargatePoolNative is StargatePoolNative, IMockStargatePool {
    constructor(
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        uint8 _tokenDecimals,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargatePoolNative(_lpTokenName, _lpTokenSymbol, _tokenDecimals, _sharedDecimals, _endpoint, _owner) {
        tokenMessaging = address(new TokenMessaging(_endpoint, _owner, 128));
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

    function getPaths(uint32 _eid) public view returns (Path memory) {
        return paths[_eid];
    }

    function ensureCredit(uint32 _eid, uint64 _amountSD) public override {
        Path storage path = paths[_eid];
        path.credit = _amountSD;
    }
}

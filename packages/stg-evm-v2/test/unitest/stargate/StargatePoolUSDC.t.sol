// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";
import { StargatePoolUSDC } from "../../../src/usdc/StargatePoolUSDC.sol";
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
import { USDC } from "../../../src/mocks/USDC.sol";
import { PathLib } from "../../../src/libs/Path.sol";

contract StargatePoolUSDCTest is StargatePoolTest {
    USDC public usdc;

    function _setUpStargate() internal override {
        usdc = new USDC("USDC", "USDC");
        stargate = new MockStargatePoolUSDC(
            "LP Name",
            "LP",
            address(usdc),
            18,
            6, // share decimals
            LzUtil.deployEndpointV2(LOCAL_EID, address(this)), // endpoint v2
            address(this) // owner
        );
        lpToken = LPToken(stargate.lpToken());
        usdc.mint(address(this), 10000 ether);
    }

    function test_RevertIf_AllowBurnByNonOwner() public {
        uint64 amountSD = 1000;
        stargate.ensureCredit(LOCAL_EID, amountSD);
        _approveAndPrank(ALICE);
        vm.expectRevert("Ownable: caller is not the owner");
        StargatePoolUSDC(address(stargate)).allowBurn(address(this), amountSD);
    }

    function test_RevertIf_BurnCreditByNonAdmin() public {
        uint64 amountSD = 1000;
        stargate.ensureCredit(LOCAL_EID, amountSD);
        _approveAndPrank(ALICE);
        vm.expectRevert(StargateBase.Stargate_Unauthorized.selector);
        StargatePoolUSDC(address(stargate)).burnLockedUSDC();
    }

    function test_RevertIf_BurnTooMuchToken() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        _approveAndPrank(ALICE);
        stargate.deposit(ALICE, amountLD);
        StargatePoolUSDC(address(stargate)).allowBurn(address(this), amountSD + 1);
        vm.expectRevert(StargatePoolUSDC.StargatePoolUSDC_BurnAmountExceedsBalance.selector);
        StargatePoolUSDC(address(stargate)).burnLockedUSDC();
    }

    function test_RevertIf_BurnTooMuchCredit() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        _approveAndPrank(ALICE);
        stargate.deposit(ALICE, amountLD);
        MockStargatePoolUSDC(address(stargate)).sendCredit(LOCAL_EID, 1);
        StargatePoolUSDC(address(stargate)).allowBurn(address(this), amountSD);
        vm.expectRevert();
        StargatePoolUSDC(address(stargate)).burnLockedUSDC();
    }

    function test_BurnCredit(uint64 amountSD) public {
        vm.assume(amountSD < type(uint64).max); // deposit of type(uint64).max will result in Path_UnlimitedCredit on _inflow(...)

        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        _approveAndPrank(ALICE);
        stargate.deposit(ALICE, amountLD);
        StargatePoolUSDC(address(stargate)).allowBurn(address(this), amountSD);

        StargatePoolUSDC(address(stargate)).burnLockedUSDC();
        assertLocalCreditEq(0);
        assertEq(_balanceOf(address(stargate)), 0);
        assertEq(stargate.poolBalance(), 0);
    }

    function _deal(address _to, uint256 _amount, uint256 _fee) internal override {
        usdc.mint(_to, _amount);
        if (_fee > 0) vm.deal(_to, _fee);
    }

    function _balanceOf(address _account) internal view override returns (uint256) {
        return usdc.balanceOf(_account);
    }

    function _approveAndPrank(address _account, address _spender) internal override {
        vm.prank(_account);
        usdc.approve(_spender, type(uint256).max);
        vm.prank(_account);
    }
}

contract MockStargatePoolUSDC is StargatePoolUSDC, IMockStargatePool {
    constructor(
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        address _token,
        uint8 _tokenDecimals,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargatePoolUSDC(_lpTokenName, _lpTokenSymbol, _token, _tokenDecimals, _sharedDecimals, _endpoint, _owner) {
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

    function sendCredit(uint32 _eid, uint64 _amountSD) public {
        Path storage path = paths[_eid];
        path.credit = path.credit - _amountSD;
    }
}

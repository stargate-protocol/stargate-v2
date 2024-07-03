// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { StargateOftTest, IMockStargate } from "./StargateOft.t.sol";
import { USDC } from "../../../src/mocks/USDC.sol";
import { TokenMessaging } from "../../../src/messaging/TokenMessaging.sol";
import { StargateOFTUSDC } from "../../../src/usdc/StargateOFTUSDC.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { Path } from "../../../src/libs/Path.sol";

contract StargateOftUSDCTest is StargateOftTest {
    USDC public usdc;

    function _setUpStargate() internal override {
        usdc = new USDC("USDC", "USDC");
        stargate = new MockStargateOFTUSDC(
            address(usdc),
            6,
            LzUtil.deployEndpointV2(LOCAL_EID, address(this)),
            address(this)
        );
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

contract MockStargateOFTUSDC is StargateOFTUSDC, IMockStargate {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFTUSDC(_token, _sharedDecimals, _endpoint, _owner) {
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

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { OFTTokenERC20 } from "../../../src/utils/OFTTokenERC20.sol";
import { StargatePoolMigratable } from "../../../src/StargatePoolMigratable.sol";
import { LPToken } from "../../../src/utils/LPToken.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { StargateBase } from "../../../src/StargateBase.sol";
import { StargatePool } from "../../../src/StargatePool.sol";
import { IMockStargatePool, StargatePoolTest } from "./StargatePool.t.sol";
import { Path, PathLib } from "../../../src/libs/Path.sol";
import { TokenMessaging } from "../../../src/messaging/TokenMessaging.sol";
import { USDT } from "../../../src/mocks/USDT.sol";

contract StargatePoolMigratableTest is StargatePoolTest {
    USDT public usdt; // could be OFTTokenERC20 or OFTTokenERC20Upgradeable, just using a mock "USDT" implementation

    function _setUpStargate() internal override {
        usdt = new USDT();
        usdt.addMinter(address(this));
        stargate = new MockStargatePoolMigratable(
            "LP Name",
            "LP",
            address(usdt),
            18,
            6, // share decimals
            LzUtil.deployEndpointV2(LOCAL_EID, address(this)), // endpoint v2
            address(this) // owner
        );
        usdt.addMinter(address(stargate));
        lpToken = LPToken(stargate.lpToken());
        usdt.mint(address(this), 10000 ether);
    }

    function test_allowBurn() public {
        // 1. test non-owner
        vm.prank(ALICE);
        vm.expectRevert("Ownable: caller is not the owner");
        StargatePoolMigratable(address(stargate)).allowBurn(ALICE, 1000);

        // 2. test owner
        StargatePoolMigratable(address(stargate)).allowBurn(address(this), 1000);
        assertEq(StargatePoolMigratable(address(stargate)).burnAdmin(), address(this));
        assertEq(StargatePoolMigratable(address(stargate)).burnAllowanceSD(), 1000);
    }

    function test_burnLocked_StargateUnauthorized() public {
        // test non burnAdmin
        vm.prank(ALICE);
        vm.expectRevert(StargateBase.Stargate_Unauthorized.selector);
        StargatePoolMigratable(address(stargate)).burnLocked();
    }

    function test_burnLocked_BurnAmountExceedsBalance() public {
        // test burn amount exceeds balance
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        _approveAndPrank(ALICE);
        stargate.deposit(ALICE, amountLD);
        StargatePoolMigratable(address(stargate)).allowBurn(address(this), amountSD + 1);

        vm.expectRevert(StargatePoolMigratable.StargatePoolMigratable_BurnAmountExceedsBalance.selector);
        StargatePoolMigratable(address(stargate)).burnLocked();
    }

    function test_burnLocked_BurnTooMuchCredit() public {
        uint64 amountSD = 1000;
        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        _approveAndPrank(ALICE);
        stargate.deposit(ALICE, amountLD);
        MockStargatePoolMigratable(address(stargate)).sendCredit(LOCAL_EID, 1);
        StargatePoolMigratable(address(stargate)).allowBurn(address(this), amountSD);
        vm.expectRevert(PathLib.Path_InsufficientCredit.selector);
        StargatePoolMigratable(address(stargate)).burnLocked();
    }

    function test_BurnCredit(uint64 amountSD) public {
        vm.assume(amountSD < type(uint64).max); // deposit of type(uint64).max will result in Path_UnlimitedCredit on _inflow(...)

        uint256 amountLD = stargate.sdToLd(amountSD);
        _deal(ALICE, amountLD);
        _approveAndPrank(ALICE);
        stargate.deposit(ALICE, amountLD);
        MockStargatePoolMigratable(address(stargate)).allowBurn(address(this), amountSD);

        MockStargatePoolMigratable(address(stargate)).burnLocked();
        assertLocalCreditEq(0);
        assertEq(_balanceOf(address(stargate)), 0);
        assertEq(stargate.poolBalance(), 0);
    }

    function _deal(address _to, uint256 _amount, uint256 _fee) internal override {
        usdt.mint(_to, _amount);
        if (_fee > 0) vm.deal(_to, _fee);
    }

    function _balanceOf(address _account) internal view override returns (uint256) {
        return usdt.balanceOf(_account);
    }

    function _approveAndPrank(address _account, address _spender) internal override {
        vm.prank(_account);
        usdt.approve(_spender, type(uint256).max);
        vm.prank(_account);
    }
}

contract MockStargatePoolMigratable is StargatePoolMigratable, IMockStargatePool {
    constructor(
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        address _token,
        uint8 _tokenDecimals,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargatePoolMigratable(_lpTokenName, _lpTokenSymbol, _token, _tokenDecimals, _sharedDecimals, _endpoint, _owner) {
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

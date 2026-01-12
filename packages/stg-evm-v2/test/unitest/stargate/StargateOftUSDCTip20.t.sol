// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { StargateOftTest, IMockStargate } from "./StargateOft.t.sol";
import { CircleFiatToken } from "../../../src/mocks/CircleFiatToken.sol";
import { TokenMessagingAlt } from "../../../src/messaging/TokenMessagingAlt.sol";
import { StargateOFTUSDCTip20 } from "../../../src/usdc/StargateOFTUSDCTip20.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { Path } from "../../../src/libs/Path.sol";
import { AltFeeTokenMock } from "../../layerzero/mocks/AltFeeTokenMock.sol";

contract StargateOftUSDCTip20Test is StargateOftTest {
    CircleFiatToken public tip20Token;
    AltFeeTokenMock public feeToken;

    function test_RideBus() public override {
        // The ALT chain does not support bus mode
        vm.skip(true);
    }

    function test_RideBusWithFee() public override {
        // The ALT chain does not support bus mode
        vm.skip(true);
    }

    function _setUpStargate() internal override {
        tip20Token = new CircleFiatToken("Tip20Token", "T2T");
        feeToken = new AltFeeTokenMock();

        stargate = new MockStargateOFTUSDCTip20(
            address(tip20Token),
            6,
            LzUtil.deployEndpointV2Alt(LOCAL_EID, address(this), address(feeToken)),
            address(this)
        );
    }

    function _deal(address _to, uint256 _amount, uint256 _fee) internal override {
        tip20Token.mint(_to, _amount);
        // ALT endpoints use an ERC20 fee token instead of ETH; fund and approve it.
        if (_fee > 0) {
            feeToken.mint(_to, _fee);
            // Approve Stargate to pull the fee token during taxi
            vm.prank(_to);
            feeToken.approve(address(stargate), _fee);
        }
    }

    function _balanceOf(address _account) internal view override returns (uint256) {
        return tip20Token.balanceOf(_account);
    }

    function _approveAndPrank(address _account, address _spender) internal override {
        vm.prank(_account);
        tip20Token.approve(_spender, type(uint256).max);
        vm.prank(_account);
    }

    // In ALT, msg.value must be zero; fees are paid in the ALT fee token.
    function _getValue(uint256 /*_value*/, uint256 /*_fee*/) internal pure override returns (uint256) {
        return 0;
    }
}

contract MockStargateOFTUSDCTip20 is StargateOFTUSDCTip20, IMockStargate {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFTUSDCTip20(_token, _sharedDecimals, _endpoint, _owner) {
        tokenMessaging = address(new TokenMessagingAlt(_endpoint, _owner, 128));
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

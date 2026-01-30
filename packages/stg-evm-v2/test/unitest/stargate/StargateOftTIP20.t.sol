// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { StargateOftTest, IMockStargate } from "./StargateOft.t.sol";
import { TIP20 } from "@tempo/TIP20.sol";
import { TokenMessagingAlt } from "../../../src/messaging/TokenMessagingAlt.sol";
import { StargateOFTTIP20 } from "../../../src/tip20/StargateOFTTIP20.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { Path } from "../../../src/libs/Path.sol";
import { AltFeeTokenMock } from "../../layerzero/mocks/AltFeeTokenMock.sol";
import { Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OFTLimit, OFTFeeDetail, OFTReceipt, SendParam, MessagingReceipt, MessagingFee, IOFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";

contract StargateOftTIP20Test is StargateOftTest {
    bytes32 internal constant DEFAULT_ADMIN_ROLE = bytes32(0);
    bytes32 internal constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    TIP20 public tip20Token;
    AltFeeTokenMock public feeToken;
    bytes32 internal constant MOCK_GUID = bytes32(uint(1));

    function test_RideBus() public override {
        // The ALT chain does not support bus mode
        vm.skip(true);
    }

    function test_RideBusWithFee() public override {
        // The ALT chain does not support bus mode
        vm.skip(true);
    }

    function test_ReceiveTokenTaxi(uint32 _amountInSD, uint64 _nonce, bytes memory _composeMsg) public {
        // 1. Set up a _composeMsg test case.
        uint256 amountInLD = stargate.sdToLd(_amountInSD);
        Origin memory origin = Origin({ srcEid: 2, sender: AddressCast.toBytes32(ALICE), nonce: _nonce });

        // 2. Assert post-state: receiver balance increases by amountLD
        uint256 before = tip20Token.balanceOf(ALICE);
        vm.prank(stargate.getTokenMessaging());
        MockStargateOFTTIP20(address(stargate)).receiveTokenTaxi(origin, MOCK_GUID, ALICE, _amountInSD, bytes(""));
        uint256 afterBalance = tip20Token.balanceOf(ALICE);
        assertEq(afterBalance, before + amountInLD);
    }

    function test_TransferTokenOwnership() public {
        tip20Token.grantRole(DEFAULT_ADMIN_ROLE, address(stargate));

        assertTrue(tip20Token.hasRole(address(stargate), DEFAULT_ADMIN_ROLE));

        address newOwner = address(this);
        MockStargateOFTTIP20(address(stargate)).transferTokenOwnership(newOwner);

        assertTrue(tip20Token.hasRole(newOwner, DEFAULT_ADMIN_ROLE));
        assertFalse(tip20Token.hasRole(address(stargate), DEFAULT_ADMIN_ROLE));
    }

    function _setUpStargate() internal override {
        tip20Token = new TIP20("TIP20Token", "T2T", "USD", TIP20(address(0)), address(this), address(this));
        feeToken = new AltFeeTokenMock();

        stargate = new MockStargateOFTTIP20(
            address(tip20Token),
            6,
            LzUtil.deployEndpointV2Alt(LOCAL_EID, address(this), address(feeToken)),
            address(this)
        );
        tip20Token.grantRole(ISSUER_ROLE, address(stargate));
    }

    function _deal(address _to, uint256 _amount, uint256 _fee) internal override {
        vm.prank(address(stargate));
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

contract MockStargateOFTTIP20 is StargateOFTTIP20, IMockStargate {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFTTIP20(_token, _sharedDecimals, _endpoint, _owner) {
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

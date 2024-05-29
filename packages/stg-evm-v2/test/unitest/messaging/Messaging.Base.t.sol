// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { MessagingBase, Origin } from "../../../src/messaging/MessagingBase.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { IOAppCore } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";

contract BaseMessagingTest is Test {
    bytes internal constant NOT_OWNER_ERROR = "Ownable: caller is not the owner";
    address public ALICE = makeAddr("alice");

    TestMessageBase public messaging;

    function setUp() public {
        messaging = new TestMessageBase(LzUtil.deployEndpointV2(1, address(this)), address(this));
    }

    function test_SetPlanner(address _newPlanner) public {
        // set planner with owner which is address(this)
        vm.expectEmit();
        emit MessagingBase.PlannerSet(_newPlanner);
        messaging.setPlanner(_newPlanner);
        assertEq(messaging.planner(), _newPlanner);

        // revert if not owner
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        messaging.setPlanner(_newPlanner);
    }

    function test_SetMaxAssetId(uint16 _maxAssetId) public {
        // set max asset id with owner which is address(this)
        vm.expectEmit();
        emit MessagingBase.MaxAssetIdSet(_maxAssetId);
        messaging.setMaxAssetId(_maxAssetId);
        assertEq(messaging.maxAssetId(), _maxAssetId);

        // revert if not owner
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        messaging.setMaxAssetId(_maxAssetId);
    }

    function test_MaxAssetIdIncrease(uint16 _assetId, uint16 _biggerAssetId) public {
        vm.assume(_assetId > 0);
        vm.assume(_biggerAssetId > _assetId);

        address stargateImpl = vm.addr(1);
        vm.expectEmit();
        emit MessagingBase.AssetIdSet(stargateImpl, _assetId);
        messaging.setAssetId(stargateImpl, _assetId);
        assertEq(messaging.maxAssetId(), _assetId);

        vm.expectEmit();
        emit MessagingBase.AssetIdSet(stargateImpl, _biggerAssetId);
        messaging.setAssetId(stargateImpl, _biggerAssetId);
        assertEq(messaging.maxAssetId(), _biggerAssetId);
    }

    function test_SetAssetId(uint16 _assetId) public {
        vm.assume(_assetId > 0);
        // set asset id with owner which is address(this)
        address stargateImpl = vm.addr(1);
        vm.expectEmit();
        emit MessagingBase.AssetIdSet(stargateImpl, _assetId);
        messaging.setAssetId(stargateImpl, _assetId);
        assertEq(messaging.assetIds(stargateImpl), _assetId);
        assertEq(messaging.stargateImpls(_assetId), stargateImpl);

        // revert if not owner
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        messaging.setAssetId(stargateImpl, _assetId);
    }

    function test_SetAssetId_delete(uint16 _assetId, address _stargateImplAddr) public {
        vm.assume(_assetId > 0);
        vm.assume(_stargateImplAddr != address(0));

        messaging.setAssetId(_stargateImplAddr, _assetId);
        assertEq(messaging.assetIds(_stargateImplAddr), _assetId);
        assertEq(messaging.stargateImpls(_assetId), _stargateImplAddr);

        messaging.setAssetId(address(0), _assetId);
        assertEq(messaging.assetIds(_stargateImplAddr), 0);
        assertEq(messaging.stargateImpls(_assetId), address(0));
    }

    function test_SetAssetIdWithInvalidAssetId(address _stargateImplAddr) public {
        vm.assume(_stargateImplAddr != address(0));
        uint16 _assetId = 0;

        vm.expectRevert(MessagingBase.Messaging_InvalidAssetId.selector);
        messaging.setAssetId(_stargateImplAddr, _assetId);
    }

    function test_SetAssetIdWithNewAssetId(uint16 _assetId, uint16 _newAssetId, address stargateImplAddr) public {
        vm.assume(_assetId != 0);
        vm.assume(_newAssetId != 0);
        vm.assume(_assetId != _newAssetId);
        vm.assume(stargateImplAddr != address(0));

        vm.expectEmit();
        emit MessagingBase.AssetIdSet(stargateImplAddr, _assetId);
        messaging.setAssetId(stargateImplAddr, _assetId);
        assertEq(messaging.assetIds(stargateImplAddr), _assetId);
        assertEq(messaging.stargateImpls(_assetId), stargateImplAddr);

        // change asset id
        vm.expectEmit();
        emit MessagingBase.AssetIdSet(stargateImplAddr, _newAssetId);
        messaging.setAssetId(stargateImplAddr, _newAssetId);
        assertEq(messaging.assetIds(stargateImplAddr), _newAssetId);
        assertEq(messaging.stargateImpls(_newAssetId), stargateImplAddr);
        assertEq(messaging.stargateImpls(_assetId), address(0));
    }

    function test_SetAssetIdWithNewStargateImpl(uint16 _assetId, address _newStargateImplAddr) public {
        vm.assume(_assetId > 0);
        address stargateImplAddr = makeAddr("stargateImpl");
        vm.assume(_newStargateImplAddr != address(0) && _newStargateImplAddr != stargateImplAddr);

        vm.expectEmit();
        emit MessagingBase.AssetIdSet(stargateImplAddr, _assetId);
        messaging.setAssetId(stargateImplAddr, _assetId);
        assertEq(messaging.assetIds(stargateImplAddr), _assetId);
        assertEq(messaging.stargateImpls(_assetId), stargateImplAddr);

        // change stargateImpl
        vm.expectEmit();
        emit MessagingBase.AssetIdSet(_newStargateImplAddr, _assetId);
        messaging.setAssetId(_newStargateImplAddr, _assetId);
        assertEq(messaging.assetIds(_newStargateImplAddr), _assetId);
        assertEq(messaging.assetIds(stargateImplAddr), uint16(0));
        assertEq(messaging.stargateImpls(_assetId), _newStargateImplAddr);
    }

    function test_SetAssetIdWithNewStargateImplAndNewAssetId(
        address _stargateImplA,
        uint16 _assetIdA,
        address _stargateImplB,
        uint16 _assetIdB
    ) public {
        vm.assume(_stargateImplA != _stargateImplB && _stargateImplA != address(0));
        vm.assume(_assetIdA != 0);
        vm.assume(_assetIdB != 0);
        vm.assume(_assetIdA != _assetIdB);

        vm.expectEmit();
        emit MessagingBase.AssetIdSet(_stargateImplA, _assetIdA);
        messaging.setAssetId(_stargateImplA, _assetIdA);
        vm.expectEmit();
        emit MessagingBase.AssetIdSet(_stargateImplB, _assetIdB);
        messaging.setAssetId(_stargateImplB, _assetIdB);

        // change stargateImpl and assetId
        vm.expectEmit();
        emit MessagingBase.AssetIdSet(_stargateImplA, _assetIdB);
        messaging.setAssetId(_stargateImplA, _assetIdB);
        assertEq(messaging.assetIds(_stargateImplA), _assetIdB);
        assertEq(messaging.stargateImpls(_assetIdB), _stargateImplA);

        assertEq(messaging.assetIds(_stargateImplB), uint16(0));
        assertEq(messaging.stargateImpls(_assetIdA), address(0));
    }

    function test_GetStargateImpl(uint16 _assetId, uint16 _notExistAssetId) public {
        vm.assume(_assetId != 0);
        vm.assume(_notExistAssetId != _assetId);

        address stargateImpl = makeAddr("stargateImpl");
        vm.expectEmit();
        emit MessagingBase.AssetIdSet(stargateImpl, _assetId);
        messaging.setAssetId(stargateImpl, _assetId);
        assertEq(messaging.getStargateImpl(_assetId), stargateImpl);

        // revert if assetId not exists
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        messaging.getStargateImpl(_notExistAssetId);
    }

    function test_GetAssetId(uint16 _assetId, address _notExistStargateImpl) public {
        vm.assume(_assetId != 0);
        vm.assume(_notExistStargateImpl != address(0));

        address stargateImpl = makeAddr("stargateImpl");
        vm.assume(stargateImpl != _notExistStargateImpl);

        messaging.setAssetId(stargateImpl, _assetId);
        assertEq(messaging.getAssetId(stargateImpl), _assetId);

        // revert if stargateImpl not exists
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        messaging.getAssetId(_notExistStargateImpl);
    }

    function test_SetPeer(uint32 _eid, bytes32 _peer, bytes32 _newPeer) public {
        vm.assume(_peer != 0);
        vm.assume(_newPeer != 0);
        vm.assume(_peer != _newPeer);

        // set peer with owner which is address(this)
        vm.expectEmit();
        emit IOAppCore.PeerSet(_eid, _peer);
        messaging.setPeer(_eid, _peer);
        assertEq(messaging.peers(_eid), _peer);
        assertTrue(messaging.isPeer(_eid, _peer));

        // update peer
        vm.expectEmit();
        emit IOAppCore.PeerSet(_eid, _newPeer);
        messaging.setPeer(_eid, _newPeer);
        assertEq(messaging.peers(_eid), _newPeer);
        assertTrue(messaging.isPeer(_eid, _newPeer));

        // revert if not owner
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        messaging.setPeer(_eid, _peer);
    }

    function test__payLzToken(uint256 _lzTokenFee) public {
        /// @dev just ensure _payLzToken(...) doesn't throw.
        messaging.payLzToken(_lzTokenFee);
    }

    function test__lzReceiveSimulate(
        uint32 _srcEid,
        bytes32 _sender,
        uint64 _nonce,
        bytes32 _guid,
        bytes memory _message,
        address _executor,
        bytes memory _composeMsg
    ) public {
        Origin memory origin = Origin({ srcEid: _srcEid, sender: _sender, nonce: _nonce });
        /// @dev just ensure _lzReceiveSimulate(...) doesn't throw.
        messaging.do_lzReceiveSimulate(origin, _guid, _message, _executor, _composeMsg);
    }
}

/// @dev A test implementation of MessagingBase, which is abstract.
contract TestMessageBase is MessagingBase {
    constructor(address _endpoint, address _owner) MessagingBase(_endpoint, _owner) {}

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {}

    function do_lzReceiveSimulate(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) public {
        // call non-payable internal function
        _lzReceive(_origin, _guid, _message, _executor, _extraData);
    }

    function getStargateImpl(uint16 _assetId) public view returns (address) {
        return _safeGetStargateImpl(_assetId);
    }

    function getAssetId(address _stargateImpl) public view returns (uint16) {
        return _safeGetAssetId(_stargateImpl);
    }

    function payLzToken(uint256 _lzTokenFee) public {
        _payLzToken(_lzTokenFee);
    }
}

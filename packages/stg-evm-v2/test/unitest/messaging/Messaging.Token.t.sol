// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";
import { MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { EnforcedOptionParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";

import { TokenMessaging, Bus, Origin } from "../../../src/messaging/TokenMessaging.sol";
import { MessagingBase } from "../../../src/messaging/MessagingBase.sol";
import { BusLib } from "../../../src/libs/Bus.sol";
import { LzUtil } from "../../layerzero/LzUtil.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { TokenMessagingOptions } from "../../../src/messaging/TokenMessagingOptions.sol";
import { IOAppCore } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";
import { BusCodec, BusPassenger } from "../../../src/libs/BusCodec.sol";
import { RideBusParams, TaxiParams } from "../../../src/interfaces/ITokenMessaging.sol";
import { TaxiCodec } from "../../../src/libs/TaxiCodec.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { ITokenMessagingHandler } from "../../../src/interfaces/ITokenMessagingHandler.sol";
import { PseudoRandom } from "../lib/lib/PseudoRandom.sol";

contract TokenMessagingTest is Test {
    using OptionsBuilder for bytes;
    address public constant ALICE = address(0xace); // Can't use makeAddr(...) as pure functions do not support non-constants
    address public constant STARGATE_IMPL = address(0xaaaa);
    address public constant PLANNER = address(0xbbbb);

    uint16 public constant ASSET_ID = 1;
    uint32 public constant MESSAGING_EID = 1;
    uint32 public constant DST_EID = 2;
    uint32 public constant DST_EID2 = 3; // not configured
    uint80 public constant BUS_FARE = 0.001 ether;
    uint80 public constant NATIVE_DROP_FARE = 0.0002 ether;

    uint16 public constant QUEUE_CAPACITY = 128;

    uint8 internal constant MSG_TYPE_TAXI = 1; // must match TaxiCodec.MSG_TYPE_TAXI
    uint8 internal constant MIN_TAXI_SIZE = 43; // must match TaxiCodec.RECEIVER_OFFSET

    uint16 public queueCapacity;
    uint8 public maxNumPassengers;

    bytes internal constant NOT_OWNER_ERROR = "Ownable: caller is not the owner";

    MockTokenMessaging public messaging;

    function labelAddresses() internal {
        vm.label(ALICE, "alice");
        vm.label(STARGATE_IMPL, "stargateImpl");
        vm.label(PLANNER, "planner");
    }

    function setUp() public {
        labelAddresses();

        messaging = new MockTokenMessaging(
            LzUtil.deployEndpointV2(MESSAGING_EID, address(this)),
            address(this),
            QUEUE_CAPACITY
        );

        // Set enforced options on messaging
        bytes memory enforcedOption = OptionsBuilder.newOptions().addExecutorLzReceiveOption(100, 0);
        EnforcedOptionParam memory enforcedOptionParam = EnforcedOptionParam({
            msgType: messaging.MSG_TYPE_TAXI(),
            eid: DST_EID,
            options: enforcedOption
        });
        EnforcedOptionParam[] memory enforcedOptions = new EnforcedOptionParam[](1);
        enforcedOptions[0] = enforcedOptionParam;
        messaging.setEnforcedOptions(enforcedOptions);

        queueCapacity = messaging.queueCapacity();
        maxNumPassengers = uint8(queueCapacity) - 1; // 1 less than bus capacity
        uint32[] memory dstEids = new uint32[](1);
        dstEids[0] = DST_EID;
        messaging.initializeBusQueueStorage(dstEids, 0, QUEUE_CAPACITY - 1);
        messaging.setGasLimit(DST_EID, 100, 10);
        messaging.setPlanner(PLANNER);
        vm.prank(PLANNER);
        messaging.setFares(DST_EID, BUS_FARE, NATIVE_DROP_FARE);
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        messaging.setMaxNumPassengers(DST_EID, maxNumPassengers);
        messaging.setPeer(DST_EID, AddressCast.toBytes32(address(this)));
    }

    function test_SetMaxNumPassengers(uint8 newMaxNumPassengers) public {
        if (newMaxNumPassengers < queueCapacity) {
            vm.expectEmit();
            emit TokenMessaging.MaxNumPassengersSet(DST_EID2, newMaxNumPassengers);
            messaging.setMaxNumPassengers(DST_EID2, newMaxNumPassengers);
            (uint8 _maxNumPassengers, , , , ) = messaging.busQueues(DST_EID2);
            assertEq(_maxNumPassengers, newMaxNumPassengers);
        } else {
            vm.expectRevert(TokenMessaging.Messaging_MaxNumPassengersExceedsQueueCapacity.selector);
            messaging.setMaxNumPassengers(DST_EID2, newMaxNumPassengers);
        }

        // revert if not owner
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        messaging.setMaxNumPassengers(DST_EID2, newMaxNumPassengers);
    }

    function test_setNativeDropAmount(uint32 _eid, uint128 _nativeDropAmount) public {
        // 1. test that a non-owner call to setNativeDropAmount(...) reverts
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        messaging.setNativeDropAmount(_eid, _nativeDropAmount);

        // 2. test a successful call to setNativeDropAmount(...)
        vm.expectEmit();
        emit TokenMessaging.NativeDropAmountSet(_eid, _nativeDropAmount);
        messaging.setNativeDropAmount(_eid, _nativeDropAmount);
        assertEq(messaging.nativeDropAmounts(_eid), _nativeDropAmount);
    }

    function test_constructor(uint16 capacity) public {
        if (capacity < 2 || 2 ** 16 % capacity != 0) {
            // cannot use expectRevert when the revert happens in the parent constructor
            try new MockTokenMessaging(LzUtil.deployEndpointV2(MESSAGING_EID, address(this)), address(this), capacity) {
                fail();
            } catch (bytes memory reason) {
                assertGe(reason.length, 4);
                bytes4 selector;
                assembly {
                    selector := mload(add(reason, 0x20))
                }
                assertEq(selector, TokenMessaging.Messaging_InvalidQueueCapacity.selector);
            }
        } else {
            new MockTokenMessaging(LzUtil.deployEndpointV2(MESSAGING_EID, address(this)), address(this), capacity);
        }
    }

    function test_InitializeBusStorage() public {
        uint32[] memory dstEids = new uint32[](1);
        dstEids[0] = DST_EID;

        // normal operation
        vm.expectEmit();
        emit TokenMessaging.BusQueueStorageInitialized(DST_EID, 0, QUEUE_CAPACITY - 1);
        messaging.initializeBusQueueStorage(dstEids, 0, QUEUE_CAPACITY - 1);

        // revert if not owner
        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        messaging.initializeBusQueueStorage(dstEids, 0, QUEUE_CAPACITY - 1);

        // capped at QUEUE_CAPACITY - 1
        vm.expectEmit();
        emit TokenMessaging.BusQueueStorageInitialized(DST_EID, 0, QUEUE_CAPACITY - 1);
        messaging.initializeBusQueueStorage(dstEids, 0, QUEUE_CAPACITY);

        // Honors starting slot
        vm.expectEmit();
        emit TokenMessaging.BusQueueStorageInitialized(DST_EID, 1, QUEUE_CAPACITY - 1);
        messaging.initializeBusQueueStorage(dstEids, 1, QUEUE_CAPACITY - 1);
    }

    function test_SetFares() public {
        uint80 busFare = BUS_FARE + 1;
        uint80 busAndNativeDropFare = NATIVE_DROP_FARE + 1;

        vm.prank(PLANNER);
        vm.expectEmit();
        emit TokenMessaging.FaresSet(DST_EID2, busFare, busAndNativeDropFare);
        messaging.setFares(DST_EID2, busFare, busAndNativeDropFare);
        (, uint80 currentBusFare, uint80 currentNativeFare, , ) = messaging.busQueues(DST_EID2);
        assertEq(currentBusFare, busFare);
        assertEq(currentNativeFare, busAndNativeDropFare);

        // revert if not planner
        vm.prank(ALICE);
        vm.expectRevert(MessagingBase.Messaging_Unauthorized.selector);
        messaging.setFares(DST_EID2, busFare, busAndNativeDropFare);
    }

    function test_QuoteFares_Messaging_NotEnoughPassengers() public {
        // ensure reversion if numPassengers is 0 to avoid division by 0
        vm.expectRevert(TokenMessaging.Messaging_NotEnoughPassengers.selector);
        messaging.quoteFares(DST_EID, 0);
    }

    function test_QuoteFares(uint8 _numPassengers, uint128 _fee) public {
        // 1. Assume there are some passengers.  The negative test is handled by test_QuoteFares_Messaging_NotEnoughPassengers
        vm.assume(_numPassengers > 0);
        vm.assume(_fee / _numPassengers > 0); // avoid 0 fee

        // 2. Mock endpoint quote response.
        _mockEndpointQuote(_fee);

        // 3. Ensure the proper fare is quoted.
        (uint256 quotedFare, ) = messaging.quoteFares(DST_EID, _numPassengers);
        assertEq(quotedFare, _fee / _numPassengers);
    }

    function test_QuoteFares_Overflow() public {
        uint8 numPassengers = 2;

        messaging.setNativeDropAmount(DST_EID, type(uint128).max);

        _mockEndpointQuote(100);
        vm.expectRevert("SafeCast: value doesn't fit in 128 bits");
        messaging.quoteFares(DST_EID, numPassengers);
    }

    function test_RevertIf_QuoteBaseBusFareWithoutPeer() public {
        uint8 numPassengers = 10;
        messaging.setGasLimit(DST_EID2, 100, 10);
        vm.expectRevert(abi.encodeWithSelector(IOAppCore.NoPeer.selector, DST_EID2));
        messaging.quoteFares(DST_EID2, numPassengers);
    }

    function test_RevertIf_QuoteRideBusWithoutFare() public {
        RideBusParams memory params = RideBusParams({
            sender: ALICE,
            dstEid: DST_EID2,
            receiver: AddressCast.toBytes32(ALICE),
            amountSD: 100,
            nativeDrop: false
        });
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidFare.selector, false));
        messaging.quoteRideBus(params.dstEid, false);
    }

    function test_QuoteRideBus(uint80 busFare, uint80 busAndNativeDropFare) public {
        vm.assume(busFare > 0);

        vm.prank(PLANNER);
        messaging.setFares(DST_EID, busFare, busAndNativeDropFare);
        RideBusParams memory params = RideBusParams({
            sender: ALICE,
            dstEid: DST_EID,
            receiver: AddressCast.toBytes32(ALICE),
            amountSD: 100,
            nativeDrop: false
        });
        MessagingFee memory fee = messaging.quoteRideBus(params.dstEid, false);
        assertEq(fee.nativeFee, (uint128(busFare)));
    }

    function test_RideBus() public {
        uint80 busFare = 0.0001 ether;
        uint80 busAndNativeDropFare = 0.0002 ether;
        uint16 assetId = 2;
        address stargateImpl = address(0xbbbb);
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        _rideBus(DST_EID2, 1, busFare, false, ALICE, assetId, stargateImpl);
        messaging.setAssetId(stargateImpl, assetId);
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidFare.selector, false));
        _rideBus(DST_EID2, 1, busFare, false, ALICE, assetId, stargateImpl);
        vm.prank(PLANNER);
        messaging.setFares(DST_EID2, busFare, busAndNativeDropFare);
        _rideBus(DST_EID2, 1, busFare, false, ALICE, assetId, stargateImpl);
    }

    function test_RevertIf_RideBusExceedCapacity() public {
        BusPassenger[] memory busPassengers = _rideBus(maxNumPassengers);
        vm.expectRevert(BusLib.Bus_QueueFull.selector);
        _rideBus(1);

        // ensure bus is still drivable
        _mockEndpointSend(BUS_FARE * maxNumPassengers);
        messaging.driveBus(DST_EID, _encodePassengers(busPassengers));
    }

    // same as test_RevertIf_RideBusExceedCapacity but using a bus that has been ridden/driven already.
    function test_RevertIf_RideBusExceedCapacity_used_bus(uint8 rideNum) public {
        vm.assume(rideNum > 0 && rideNum <= maxNumPassengers);
        messaging.setMaxNumPassengers(DST_EID, maxNumPassengers);

        // use the bus prior to the test
        _do_test_driveBus(rideNum, rideNum);
        _do_test_driveBus(rideNum, rideNum);
        _do_test_driveBus(rideNum, rideNum);

        // ride the bus to capacity (queueCapacity - 1)
        BusPassenger[] memory busPassengers = _rideBus(maxNumPassengers);

        // ride once more, causing a Bus_QueueFull error
        vm.expectRevert(BusLib.Bus_QueueFull.selector);
        _rideBus(1);

        // ensure the bus is drivable
        _mockEndpointSend(BUS_FARE * maxNumPassengers);
        messaging.driveBus(DST_EID, _encodePassengers(busPassengers));
    }

    function test_RevertIf_RideBusByNonStargate() public {
        RideBusParams memory params = RideBusParams({
            sender: ALICE,
            dstEid: DST_EID,
            receiver: AddressCast.toBytes32(ALICE),
            amountSD: 100,
            nativeDrop: false
        });
        vm.deal(ALICE, BUS_FARE);
        vm.prank(ALICE);
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        messaging.rideBus(params);
    }

    /// @dev Expect revert when non-stargate calls TokenMessaging.rideBus(...)
    function test_RevertIf_RideBus_MessagingUnavailable() public {
        vm.prank(ALICE); // should fail in safeGetFare(...), as msg.sender is not stargate
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        messaging.rideBus(_getDefaultRideBusParams());
    }

    function test_RideBusWithNativeDrop() public {
        _rideBus(1, BUS_FARE, true, ALICE);
    }

    function test_RevertIf_QuoteDriveBusWithNoPassengers() public {
        uint80 busFare = 0.0001 ether;
        uint80 busAndNativeDropFare = 0.0002 ether;
        vm.prank(PLANNER);
        messaging.setFares(DST_EID, busFare, busAndNativeDropFare);
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidNumPassengers.selector, 0));
        messaging.quoteDriveBus(DST_EID, new bytes(0));
    }

    function test_RevertIf_QuoteDriveBusWithoutNecessarySteps() public {
        vm.prank(PLANNER);
        messaging.setFares(DST_EID2, BUS_FARE, NATIVE_DROP_FARE);
        BusPassenger[] memory details = _rideBus(DST_EID2, 1, BUS_FARE, false, ALICE);
        bytes memory passengersInfo = _encodePassengers(details);
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidNumPassengers.selector, 1));
        messaging.quoteDriveBus(DST_EID2, passengersInfo);

        messaging.setMaxNumPassengers(DST_EID2, maxNumPassengers);
        vm.expectRevert(TokenMessagingOptions.MessagingOptions_ZeroGasLimit.selector);
        messaging.quoteDriveBus(DST_EID2, passengersInfo);

        messaging.setGasLimit(DST_EID2, 100, 10);
        vm.expectRevert(abi.encodeWithSelector(IOAppCore.NoPeer.selector, DST_EID2));
        messaging.quoteDriveBus(DST_EID2, passengersInfo);
    }

    function test_QuoteDriveBus1Passenger() public {
        this._do_test_quoteDriveBus(1, 1);
    }

    function test_QuoteDriveQueueFullPassenger() public {
        vm.prank(PLANNER);
        this._do_test_quoteDriveBus(maxNumPassengers, maxNumPassengers);
    }

    function test_QuoteDriveBusPartialPassenger() public {
        vm.prank(PLANNER);
        this._do_test_quoteDriveBus(maxNumPassengers, type(uint8).max / 2);
    }

    function test_RevertIf_DriveBusWithoutNecessarySteps() public {
        uint80 busFare = 0.0001 ether;
        uint80 busAndNativeDropFare = 0.0002 ether;
        messaging.setAssetId(STARGATE_IMPL, ASSET_ID);
        vm.prank(PLANNER);
        messaging.setFares(DST_EID2, busFare, busAndNativeDropFare);

        BusPassenger[] memory details = _rideBus(DST_EID2, 1, busFare, false, ALICE);
        bytes memory passengerInfo = _encodePassengers(details);
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidNumPassengers.selector, 1));
        messaging.driveBus(DST_EID2, passengerInfo);

        messaging.setMaxNumPassengers(DST_EID2, maxNumPassengers);
        vm.expectRevert(TokenMessagingOptions.MessagingOptions_ZeroGasLimit.selector);
        messaging.driveBus(DST_EID2, passengerInfo);

        messaging.setGasLimit(DST_EID2, 100, 10);
        vm.expectRevert(abi.encodeWithSelector(IOAppCore.NoPeer.selector, DST_EID2));
        messaging.driveBus(DST_EID2, passengerInfo);
    }

    function test_RevertIf_DriveBusExceedMaxPassengers() public {
        messaging.setMaxNumPassengers(DST_EID, 1);
        BusPassenger[] memory details = _rideBus(2);
        bytes memory passengerInfo = _encodePassengers(details);
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidNumPassengers.selector, 2));
        messaging.driveBus(DST_EID, passengerInfo);
    }

    function test_RevertIf_DriveBus0Passenger() public {
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidNumPassengers.selector, 0));
        this._do_test_driveBus(1, 0);
    }

    function test_DriveBus1Passenger() public {
        vm.expectEmit(address(messaging));
        emit BusLib.BusDriven(DST_EID, 0, 1, "0");
        this._do_test_driveBus(1, 1);
    }

    function test_DriveQueueFullPassenger() public {
        vm.expectEmit(address(messaging));
        uint8 rideAndDriveNum = maxNumPassengers;
        emit BusLib.BusDriven(DST_EID, 0, rideAndDriveNum, "0");
        this._do_test_driveBus(rideAndDriveNum, rideAndDriveNum);
    }

    function test_DriveBusPartialPassenger() public {
        vm.expectEmit(address(messaging));
        uint8 rideNum = maxNumPassengers;
        uint8 driveNum = rideNum / 2;
        emit BusLib.BusDriven(DST_EID, 0, driveNum, "0");
        this._do_test_driveBus(rideNum, driveNum);
    }

    // make sure hashChain works correctly
    function test_RevertIf_DriveBusExceedCapacity() public {
        uint72 exceedAmount = 1;
        uint8 rideAndDriveNum = uint8(queueCapacity) - 1;
        uint72 remainRideAndDriveNum = rideAndDriveNum + exceedAmount;

        while (remainRideAndDriveNum > 0) {
            if (remainRideAndDriveNum < rideAndDriveNum) {
                rideAndDriveNum = uint8(remainRideAndDriveNum);
                vm.expectEmit(address(messaging));
                emit BusLib.BusDriven(
                    DST_EID,
                    queueCapacity + exceedAmount - rideAndDriveNum - 1,
                    rideAndDriveNum,
                    "0"
                );
            }
            this._do_test_driveBus(rideAndDriveNum, rideAndDriveNum);
            remainRideAndDriveNum -= rideAndDriveNum;
        }
    }

    function test_RevertIf_QuoteTaxiWithoutNecessarySteps() public {
        uint16 assetId = 2;
        address stargateImpl = address(0xbbbb);
        messaging.setAssetId(stargateImpl, assetId);
        TaxiParams memory params = _getDefaultTaxiParams();
        params.dstEid = DST_EID2;
        uint256 mockFee = 100;
        _mockEndpointQuote(mockFee);

        messaging.setGasLimit(DST_EID2, 100, 10);
        vm.prank(stargateImpl);
        vm.expectRevert(abi.encodeWithSelector(IOAppCore.NoPeer.selector, DST_EID2));
        messaging.quoteTaxi(params, false);
    }

    function test_RevertIf_QuoteTaxiByNonStargate() public {
        TaxiParams memory params = _getDefaultTaxiParams();
        uint256 mockFee = 100;
        _mockEndpointQuote(mockFee);
        vm.expectRevert(MessagingBase.Messaging_Unavailable.selector);
        messaging.quoteTaxi(params, false);
    }

    function test_QuoteTaxi() public {
        TaxiParams memory params = _getDefaultTaxiParams();
        uint256 mockFee = 100;
        _mockEndpointQuote(mockFee);
        vm.prank(STARGATE_IMPL);
        MessagingFee memory fee = messaging.quoteTaxi(params, false);
        assertEq(fee.nativeFee, mockFee);
    }

    function test_Taxi() public {
        TaxiParams memory params = _getDefaultTaxiParams();
        uint256 mockFee = 0;
        _mockEndpointSend(mockFee);
        vm.prank(STARGATE_IMPL);
        messaging.taxi(params, MessagingFee(0, 0), ALICE);
    }

    function test_TaxiLzReceive() public {
        _mockStargateReceiveToken();
        bytes32 receiver = AddressCast.toBytes32(ALICE);
        uint256 aliceBalanceBefore = ALICE.balance;
        TaxiParams memory params = _getDefaultTaxiParams();
        vm.prank(STARGATE_IMPL);
        params.extraOptions = OptionsBuilder
            .newOptions()
            .addExecutorLzReceiveOption(100, 0)
            .addExecutorNativeDropOption(100, receiver);
        (bytes memory message, ) = messaging.encodeMessageAndOptionsForTaxi(params);
        // do not need value, because native drop is handled by executor
        messaging.doLzReceive(Origin(DST_EID, receiver, 1), "0", message);
        // ALICE.balance should not change, because native drop is handled by the executor and not in _lzReceive(...)
        assertEq(ALICE.balance, aliceBalanceBefore);
    }

    function test_DriveBusLzReceive() public {
        _mockStargateReceiveToken();
        bytes32 receiver = AddressCast.toBytes32(ALICE);
        uint8 numPassengers = uint8(QUEUE_CAPACITY - 1);
        uint8 numPassengerWithNativeDrop = 100;
        uint128 nativeDropAmount = 100;
        messaging.setNativeDropAmount(DST_EID, nativeDropAmount);
        BusPassenger[] memory busPassengers = new BusPassenger[](numPassengers);
        uint[] memory beforeBalances = new uint[](numPassengers);
        for (uint160 i = 0; i < numPassengers; i++) {
            address sender = address(uint160(ALICE) + i);
            if (i < numPassengerWithNativeDrop) {
                busPassengers[i] = _rideBus(1, BUS_FARE, true, sender)[0];
            } else {
                busPassengers[i] = _rideBus(1, BUS_FARE, false, sender)[0];
            }
            beforeBalances[i] = sender.balance;
        }
        Bus memory bus = Bus({
            passengersBytes: _encodePassengers(busPassengers),
            startTicketId: 0,
            numPassengers: numPassengers,
            totalNativeDrops: numPassengerWithNativeDrop
        });
        (bytes memory message, ) = messaging.encodeMessageAndOptionsForDrive(DST_EID, bus);
        vm.expectRevert(TokenMessaging.Messaging_InvalidMsgValue.selector);
        messaging.doLzReceive(Origin(DST_EID, receiver, 1), "0", message);

        vm.expectEmit();
        emit TokenMessaging.NativeDropApplied(ALICE, nativeDropAmount);
        messaging.doLzReceive{ value: bus.totalNativeDrops * nativeDropAmount }(
            Origin(DST_EID, receiver, 1),
            "0",
            message
        );
        for (uint160 i = 0; i < numPassengers; i++) {
            if (i < numPassengerWithNativeDrop) {
                assertEq(address(uint160(ALICE) + i).balance, beforeBalances[i] + nativeDropAmount);
            } else {
                assertEq(address(uint160(ALICE) + i).balance, beforeBalances[i]);
            }
        }
    }

    function test_ReceiveNativeDropFail() public {
        _mockStargateReceiveToken();
        address failReceiver = address(new MockFailReceiver());
        bytes32 failReceiverAddress = AddressCast.toBytes32(failReceiver);
        address successReceiver = address(uint160(ALICE) + 1);
        BusPassenger[] memory busPassengers = new BusPassenger[](2);
        uint128 nativeDropAmount = 100;
        messaging.setNativeDropAmount(DST_EID, nativeDropAmount);
        busPassengers[0] = _rideBus(1, BUS_FARE, true, failReceiver)[0];
        busPassengers[1] = _rideBus(1, BUS_FARE, true, successReceiver)[0];
        Bus memory bus = Bus({
            passengersBytes: _encodePassengers(busPassengers),
            startTicketId: 0,
            numPassengers: 2,
            totalNativeDrops: 2
        });
        (bytes memory message, ) = messaging.encodeMessageAndOptionsForDrive(DST_EID, bus);
        uint256 totalNativeDropAmount = bus.totalNativeDrops * nativeDropAmount;

        uint256 plannerBalanceBefore = messaging.planner().balance;
        vm.deal(ALICE, totalNativeDropAmount);
        vm.prank(ALICE);
        vm.expectEmit();
        emit TokenMessaging.NativeDropFailed(failReceiver, nativeDropAmount);
        messaging.doLzReceive{ value: totalNativeDropAmount }(Origin(DST_EID, failReceiverAddress, 1), "0", message);
        assertEq(failReceiver.balance, 0);
        assertEq(messaging.planner().balance, plannerBalanceBefore + nativeDropAmount);
        assertEq(successReceiver.balance, nativeDropAmount);
    }

    function test_isComposeMsgSender_TaxiCodec_InvalidMessage(bytes memory _passenger) public {
        vm.assume(_passenger.length < MIN_TAXI_SIZE);

        bytes32 receiver = AddressCast.toBytes32(ALICE);
        vm.expectRevert(TaxiCodec.TaxiCodec_InvalidMessage.selector);
        assertFalse(messaging.isComposeMsgSender(Origin(DST_EID, receiver, 1), _passenger, ALICE));
    }

    function test_isComposeMsgSender_Bus() public {
        // 1. Test a bus, which will fail as the payload is not long enough to be a Taxi.
        vm.expectRevert(TaxiCodec.TaxiCodec_InvalidMessage.selector);
        messaging.isComposeMsgSender(
            Origin(DST_EID, AddressCast.toBytes32(ALICE), 1),
            BusCodec.encodeBus(0, 0, ""),
            ALICE
        );
    }

    function test_isComposeMsgSender_NonTaxi(uint8 _seed, uint8 _minLength) public {
        vm.assume(_minLength > MIN_TAXI_SIZE);
        bytes memory message = PseudoRandom.randomBytes(_seed, _minLength);
        for (uint8 i = 0; i < 0xFF; i++) {
            message[0] = bytes1(i);
            // negative test first byte exhaustively.
            if (i != MSG_TYPE_TAXI) {
                assertFalse(
                    messaging.isComposeMsgSender(Origin(DST_EID, AddressCast.toBytes32(ALICE), 1), message, ALICE)
                );
            }
        }
    }

    function test_isComposeMsgSender_Taxi(uint64 _amountSD, bytes calldata _composeMsg) public {
        vm.assume(_amountSD > 1);
        uint16 assetId = 1;

        // 1. Test the case that the sender is the composeMsgSender
        address sender = messaging.stargateImpls(assetId);
        assertTrue(
            messaging.isComposeMsgSender(
                Origin(DST_EID, AddressCast.toBytes32(sender), 1),
                TaxiCodec.encodeTaxi(sender, assetId, AddressCast.toBytes32(sender), _amountSD, _composeMsg),
                sender
            )
        );

        // 2. Negative test that ALICE is not a composeMsgSender
        assertFalse(
            messaging.isComposeMsgSender(
                Origin(DST_EID, AddressCast.toBytes32(ALICE), 1),
                TaxiCodec.encodeTaxi(ALICE, assetId, AddressCast.toBytes32(ALICE), _amountSD, _composeMsg),
                ALICE
            )
        );
    }

    function _do_test_quoteDriveBus(uint16 rideNum, uint8 driveNum) public {
        BusPassenger[] memory busPassengers = this._rideBus(rideNum, BUS_FARE);
        bytes memory passengerInfo = this._encodePassengers(busPassengers);

        _mockEndpointQuote(BUS_FARE * driveNum - 1);
        MessagingFee memory fee = messaging.quoteDriveBus(DST_EID, passengerInfo);
        assertEq(fee.nativeFee, BUS_FARE * driveNum - 1);
        _mockEndpointQuote(BUS_FARE * driveNum);
        fee = messaging.quoteDriveBus(DST_EID, passengerInfo);
        assertEq(fee.nativeFee, BUS_FARE * driveNum);
        _mockEndpointQuote(BUS_FARE * driveNum + 1);
        fee = messaging.quoteDriveBus(DST_EID, passengerInfo);
        assertEq(fee.nativeFee, BUS_FARE * driveNum + 1);
    }

    function _do_test_driveBus(uint16 rideNum, uint8 driveNum) public {
        BusPassenger[] memory busPassengers = this._rideBus(rideNum, BUS_FARE);
        bytes memory passengerInfo = this._encodePassengers(busPassengers, driveNum);

        (, , , uint16 latestTicketOffset, uint72 startTicketIdToDrive) = messaging.busQueues(DST_EID);
        uint72 latestTicketId = startTicketIdToDrive + latestTicketOffset;
        _mockEndpointSend(BUS_FARE * driveNum);
        messaging.driveBus(DST_EID, passengerInfo);

        (, , , uint16 newLatestTicketOffset, uint72 newStartTicketIdToDrive) = messaging.busQueues(DST_EID);
        uint72 newLatestTicketId = newStartTicketIdToDrive + newLatestTicketOffset;
        assertEq(newLatestTicketId, latestTicketId);
        assertEq(newStartTicketIdToDrive, startTicketIdToDrive + driveNum);
    }

    function _encodePassengers(BusPassenger[] memory busPassengers) public pure returns (bytes memory) {
        return _encodePassengers(busPassengers, uint8(busPassengers.length));
    }

    function _encodePassengers(BusPassenger[] memory busPassengers, uint8 driveNum) public pure returns (bytes memory) {
        bytes memory passengerBytes;
        for (uint8 i = 0; i < driveNum; i++) {
            BusPassenger memory passenger = busPassengers[i];
            passengerBytes = abi.encodePacked(passengerBytes, BusCodec.encodePassenger(passenger));
        }

        return passengerBytes;
    }

    function _getDefaultRideBusParams() internal pure returns (RideBusParams memory) {
        RideBusParams memory params = RideBusParams({
            sender: ALICE,
            dstEid: DST_EID,
            receiver: AddressCast.toBytes32(ALICE),
            amountSD: 100,
            nativeDrop: false
        });
        return params;
    }

    function _getDefaultTaxiParams() internal pure returns (TaxiParams memory) {
        TaxiParams memory params = TaxiParams({
            sender: ALICE,
            dstEid: DST_EID,
            receiver: AddressCast.toBytes32(ALICE),
            amountSD: 100,
            composeMsg: "",
            extraOptions: ""
        });
        return params;
    }

    function _rideBus(uint16 numPassengers) public returns (BusPassenger[] memory busPassengers) {
        return _rideBus(DST_EID, numPassengers, BUS_FARE, false, ALICE);
    }

    function _rideBus(uint32 dstEid, uint16 numPassengers) public returns (BusPassenger[] memory busPassengers) {
        return _rideBus(dstEid, numPassengers, BUS_FARE, false, ALICE);
    }

    function _rideBus(uint16 numPassengers, uint80 busFare) public returns (BusPassenger[] memory busPassengers) {
        return _rideBus(DST_EID, numPassengers, busFare, false, ALICE);
    }

    function _rideBus(
        uint16 numPassengers,
        uint80 busFare,
        bool nativeDrop,
        address sender
    ) public returns (BusPassenger[] memory busPassengers) {
        return _rideBus(DST_EID, numPassengers, busFare, nativeDrop, sender);
    }

    function _rideBus(
        uint32 dstEid,
        uint16 numPassengers,
        uint80 busFare,
        bool nativeDrop,
        address sender
    ) public returns (BusPassenger[] memory busPassengers) {
        return _rideBus(dstEid, numPassengers, busFare, nativeDrop, sender, ASSET_ID, STARGATE_IMPL);
    }

    function _rideBus(
        uint32 dstEid,
        uint16 numPassengers,
        uint80 busFare,
        bool nativeDrop,
        address sender,
        uint16 assetId,
        address stargateImpl
    ) public returns (BusPassenger[] memory busPassengers) {
        RideBusParams memory params = RideBusParams({
            sender: sender,
            dstEid: dstEid,
            receiver: AddressCast.toBytes32(sender),
            amountSD: 100,
            nativeDrop: nativeDrop
        });
        vm.deal(stargateImpl, busFare * numPassengers);
        busPassengers = new BusPassenger[](numPassengers);
        for (uint16 i = 0; i < numPassengers; i++) {
            vm.prank(stargateImpl);
            messaging.rideBus(params);
            busPassengers[i] = BusPassenger({
                assetId: assetId,
                receiver: AddressCast.toBytes32(sender),
                amountSD: 100,
                nativeDrop: nativeDrop
            });
        }
    }

    function _mockEndpointQuote(uint256 fee) internal {
        vm.mockCall(
            address(messaging.endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.quote.selector),
            abi.encode(MessagingFee(fee, 0))
        );
    }

    function _mockEndpointSend(uint256 fee) internal {
        MessagingFee memory mockMessagingFee = MessagingFee({ nativeFee: fee, lzTokenFee: 0 });
        MessagingReceipt memory mockReceipt = MessagingReceipt({ guid: "0", nonce: 1, fee: mockMessagingFee });
        vm.mockCall(
            address(messaging.endpoint()),
            abi.encodeWithSelector(ILayerZeroEndpointV2.send.selector),
            abi.encode(mockReceipt)
        );
    }

    function _mockStargateReceiveToken() internal {
        vm.mockCall(
            STARGATE_IMPL,
            abi.encodeWithSelector(ITokenMessagingHandler.receiveTokenBus.selector),
            abi.encode()
        );
    }
}

contract MockTokenMessaging is TokenMessaging {
    constructor(
        address _endpoint,
        address _lzToken,
        uint16 _queueCapacity
    ) TokenMessaging(_endpoint, _lzToken, _queueCapacity) {}

    function encodeMessageAndOptionsForTaxi(
        TaxiParams calldata _params
    ) public view returns (bytes memory message, bytes memory options) {
        return _encodeMessageAndOptionsForTaxi(_params);
    }

    function encodeMessageAndOptionsForDrive(
        uint32 _dstEid,
        Bus memory _bus
    ) public view returns (bytes memory message, bytes memory options) {
        return _encodeMessageAndOptionsForDriveBus(_dstEid, _bus);
    }

    function doLzReceive(Origin calldata _origin, bytes32 _guid, bytes calldata _message) public payable {
        _lzReceive(_origin, _guid, _message, address(0), _message);
    }
}

contract MockFailReceiver {
    receive() external payable {
        revert("mock receive failed");
    }
}

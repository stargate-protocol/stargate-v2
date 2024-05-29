// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";

import { BusCodec, BusPassenger } from "../../../src/libs/BusCodec.sol";

import { PseudoRandom } from "./lib/PseudoRandom.sol";
import { TokenMsgUtils } from "./lib/TokenMsgUtils.sol";
import { PassengerUtils } from "./lib/PassengerUtils.sol";

import { MockBusCodec } from "./mocks/MockBusCodec.sol";
import { MockTaxiCodec } from "./mocks/MockTaxiCodec.sol";

contract BusCodecTest is Test {
    uint256 internal constant HEADER_BYTES_LENGTH = 33; // must match BusCodec.HEADER_BYTES_LENGTH

    MockBusCodec private mockBusCodec;
    MockTaxiCodec private mockTaxiCodec;

    uint8 internal constant MAX_NUM_PASSENGERS_TO_DRIVE = 10;

    function setUp() public {
        mockBusCodec = new MockBusCodec();
        mockTaxiCodec = new MockTaxiCodec();
    }

    function test_encode_decode_passenger() public {
        BusPassenger memory passenger = BusPassenger({
            assetId: 1,
            receiver: 0x0000000000000000000000000000000000000000000000000000000000000001,
            amountSD: 1,
            nativeDrop: true
        });
        bytes memory encodedPassenger = mockBusCodec.encodePassenger(passenger);

        BusPassenger memory decodedPassenger = mockBusCodec.decodePassenger(encodedPassenger);
        assertEq(decodedPassenger.assetId, passenger.assetId);
        assertEq(decodedPassenger.receiver, passenger.receiver);
        assertEq(decodedPassenger.amountSD, passenger.amountSD);
        assertEq(decodedPassenger.nativeDrop, passenger.nativeDrop);
    }

    function test_fuzz_encode_decode_passenger(
        uint8 numPassengers,
        uint16 assetId,
        bytes32 receiver,
        uint64 amountSD,
        bool nativeDrop
    ) public {
        BusPassenger[] memory passengers = new BusPassenger[](numPassengers);
        for (uint256 i = 0; i < numPassengers; i++) {
            passengers[i] = BusPassenger({
                assetId: assetId,
                receiver: receiver,
                amountSD: amountSD,
                nativeDrop: nativeDrop
            });
        }

        for (uint256 i = 0; i < numPassengers; i++) {
            bytes memory encodedPassenger = mockBusCodec.encodePassenger(passengers[i]);
            BusPassenger memory decodedPassenger = mockBusCodec.decodePassenger(encodedPassenger);
            assertEq(decodedPassenger.assetId, passengers[i].assetId);
            assertEq(decodedPassenger.receiver, passengers[i].receiver);
            assertEq(decodedPassenger.amountSD, passengers[i].amountSD);
            assertEq(decodedPassenger.nativeDrop, passengers[i].nativeDrop);
        }
    }

    function test_isBus_true(uint8 _seed, uint16 _nativeDropAmount) public {
        (, bytes memory passengers, uint128 totalNativeDrops) = PassengerUtils.createPassengers(
            uint32(_seed),
            MAX_NUM_PASSENGERS_TO_DRIVE
        );
        bytes memory busBytes = mockBusCodec.encodeBus(totalNativeDrops, _nativeDropAmount, passengers);

        bytes memory message = abi.encodePacked(busBytes);
        assertTrue(mockBusCodec.isBus(message));
    }

    function test_isBus_false(
        address _sender,
        bytes32 _receiver,
        uint16 _assetId,
        uint64 _amountSD,
        bytes memory _composeMsg
    ) public {
        assertFalse(mockBusCodec.isBus(mockTaxiCodec.encodeTaxi(_sender, _assetId, _receiver, _amountSD, _composeMsg)));
    }

    function test_isBus_malformed() public {
        for (uint8 i = 0; i < HEADER_BYTES_LENGTH; i++) {
            bytes memory message = new bytes(i);
            vm.expectRevert(BusCodec.BusCodec_InvalidMessage.selector);
            mockBusCodec.isBus(message);
        }
    }

    function test_get_num_passengers(uint8 seed) public {
        (, bytes memory passengers, ) = PassengerUtils.createPassengers(seed, MAX_NUM_PASSENGERS_TO_DRIVE);

        uint8 _numPassengers = mockBusCodec.getNumPassengers(passengers);
        assertEq(_numPassengers, MAX_NUM_PASSENGERS_TO_DRIVE);
    }

    function test_fuzzy_get_num_passengers(uint8 seed, uint8 numPassengers) public {
        (, bytes memory passengers, ) = PassengerUtils.createPassengers(seed, numPassengers);

        uint8 _numPassengers = mockBusCodec.getNumPassengers(passengers);
        assertEq(_numPassengers, numPassengers);
    }

    function test_encode_decode_bus(uint8 seed) public {
        uint16 nativeDropAmount = 1;

        (, bytes memory passengers, uint128 totalNativeDrops) = PassengerUtils.createPassengers(
            uint32(seed),
            MAX_NUM_PASSENGERS_TO_DRIVE
        );
        bytes memory busBytes = mockBusCodec.encodeBus(totalNativeDrops, nativeDropAmount, passengers);

        (uint128 _totalNativeDrops, uint128 _nativeDropAmount, BusPassenger[] memory _busPassengers) = mockBusCodec
            .decodeBus(busBytes);
        assertEq(_totalNativeDrops, totalNativeDrops);
        assertEq(_nativeDropAmount, nativeDropAmount);
        assertEq(_busPassengers.length, MAX_NUM_PASSENGERS_TO_DRIVE);
    }

    function test_fuzzy_encode_decode_bus(uint8 numPassengers, uint16 nativeDropAmount, uint8 seed) public {
        (, bytes memory passengers, uint128 totalNativeDrops) = PassengerUtils.createPassengers(seed, numPassengers);

        bytes memory busBytes = mockBusCodec.encodeBus(totalNativeDrops, nativeDropAmount, passengers);
        (uint128 _totalNativeDrops, uint128 _nativeDropAmount, BusPassenger[] memory _busPassengers) = mockBusCodec
            .decodeBus(busBytes);
        assertEq(_totalNativeDrops, totalNativeDrops);
        assertEq(_nativeDropAmount, nativeDropAmount);
        assertEq(_busPassengers.length, numPassengers);
    }

    function test_decode_bus_malformed() public {
        for (uint8 i = 0; i < HEADER_BYTES_LENGTH; i++) {
            bytes memory message = new bytes(i);
            vm.expectRevert(BusCodec.BusCodec_InvalidBusBytesLength.selector);
            mockBusCodec.decodeBus(message);
        }
    }
}

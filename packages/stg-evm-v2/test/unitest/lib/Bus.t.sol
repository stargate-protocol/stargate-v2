// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { console } from "forge-std/console.sol";
import { Test } from "forge-std/Test.sol";

import { AddressCast } from "../../../src/libs/AddressCast.sol";
import { BusQueue, Bus, BusLib } from "../../../src/libs/Bus.sol";
import { BusPassenger, BusCodec } from "../../../src/libs/BusCodec.sol";
import { PassengerUtils } from "./lib/PassengerUtils.sol";
import { PseudoRandom } from "./lib/PseudoRandom.sol";
import { TokenMsgUtils } from "./lib/TokenMsgUtils.sol";
import { MockBusCodec } from "./mocks/MockBusCodec.sol";

contract BusTest is Test {
    using AddressCast for address;

    // test default values
    uint16 internal constant BASE_FEE_MULTIPLIER_BPS_DENOMINATOR = 10_000; // must match the value in Bus.sol
    uint256 internal constant MAX_FARE = 25 ether;
    uint16 internal constant QUEUE_CAPACITY = 25;
    uint8 internal constant MAX_NUM_PASSENGERS = 10;
    uint8 internal constant PASSENGER_SIZE = 43; // must match BusCodec.PASSENGER_SIZE

    BusQueue internal queue;

    /// @dev This function is a wrapper for the queue.ride(...) function, which is an internal function.
    function ride(
        uint32 _dstEid,
        BusPassenger calldata _passenger
    ) external payable returns (uint72, bytes memory, uint80) {
        return queue.ride(QUEUE_CAPACITY, _dstEid, _passenger);
    }

    function drive(bytes calldata _passengers) external returns (Bus memory) {
        return queue.checkTicketsAndDrive(QUEUE_CAPACITY, _passengers);
    }

    function test_setMaxNumPassengers(uint8 _maxNumPassengers) public {
        BusLib.setMaxNumPassengers(queue, _maxNumPassengers);
        assertEq(queue.maxNumPassengers, _maxNumPassengers);
    }

    function test_setFares(uint80 _newBusFare, uint80 _newBusAndNativeDropFare) public {
        BusLib.setFares(queue, _newBusFare, _newBusAndNativeDropFare);
        assertEq(queue.busFare, _newBusFare);
        assertEq(queue.busAndNativeDropFare, _newBusAndNativeDropFare);
    }

    function test_safeGetFare(uint80 _busFare, uint80 _busAndNativeDropFare, bool _nativeDrop) public {
        vm.assume(_busFare > 0 && _busFare <= MAX_FARE);
        vm.assume(_busAndNativeDropFare > _busFare && _busAndNativeDropFare <= MAX_FARE);

        queue.busFare = _busFare;
        queue.busAndNativeDropFare = _busAndNativeDropFare;

        uint256 fare = queue.safeGetFare(_nativeDrop);
        if (_nativeDrop) {
            assertEq(fare, _busAndNativeDropFare);
        } else {
            assertEq(fare, _busFare);
        }
    }

    function test_ride_Bus_BusFull(
        uint8 _seed,
        uint32 _busFare,
        uint32 _busAndNativeDropFare,
        uint32 _dstEid,
        uint72 _nextTicketId
    ) public {
        vm.assume(_busFare > 0);
        vm.assume(_busAndNativeDropFare > _busFare);
        vm.assume(_nextTicketId <= type(uint72).max / 2);

        queue.busFare = _busFare;
        queue.busAndNativeDropFare = _busAndNativeDropFare;
        queue.nextTicketId = _nextTicketId;
        queue.qLength = QUEUE_CAPACITY;

        BusPassenger memory passenger = TokenMsgUtils.createPseudorandomBusPassenger(_seed);
        vm.expectRevert(BusLib.Bus_QueueFull.selector);
        this.ride(_dstEid, passenger);
    }

    function test_ride() public {
        // 1. Set up the queue
        queue.busFare = 100;
        queue.busAndNativeDropFare = 200;
        queue.maxNumPassengers = MAX_NUM_PASSENGERS;

        // 2. Ride the bus with 10 passengers 6 times.  This ensures that we will traverse all 25 available slots twice.
        uint72 expectedTicketId = 0;
        for (uint256 batchCounter = 0; batchCounter < 6; batchCounter++) {
            (BusPassenger[] memory passengerPayloads, bytes memory passengers, ) = PassengerUtils.createPassengers(
                uint32(batchCounter),
                MAX_NUM_PASSENGERS
            );

            for (uint16 i = 0; i < MAX_NUM_PASSENGERS; i++) {
                bytes memory expectedPassengerBytes = BusCodec.encodePassenger(passengerPayloads[i]);

                // 3. Ride the bus with the passenger
                vm.expectEmit();
                emit BusLib.BusRode(
                    1,
                    expectedTicketId,
                    queue.safeGetFare(passengerPayloads[i].nativeDrop),
                    expectedPassengerBytes
                );
                (uint72 ticketId, bytes memory passengerBytes, uint256 fare) = this.ride(1, passengerPayloads[i]);

                // 4. Check the ride(...) return values
                assertEq(ticketId, expectedTicketId);
                assertEq(passengerBytes, expectedPassengerBytes);
                assertEq(fare, queue.safeGetFare(passengerPayloads[i].nativeDrop));
                assertEq(expectedTicketId, ticketId);

                // 5. Calculate the expected hashChain and ensure it matches the actual hashChain.
                bytes32 expectedLastHash = expectedTicketId == 0
                    ? bytes32(0)
                    : queue.hashChain[uint16((expectedTicketId - 1) % QUEUE_CAPACITY)];
                assertEq(
                    queue.hashChain[uint16(expectedTicketId % QUEUE_CAPACITY)],
                    keccak256(abi.encodePacked(expectedLastHash, expectedPassengerBytes))
                );
                expectedTicketId++;
                // 6. Drive the bus every 200 passengers.
                if (expectedTicketId % MAX_NUM_PASSENGERS == 0) {
                    this.drive(passengers);
                }
            }
        }
    }

    function test_drive_Bus_InvalidPassenger_zero_passengers() public {
        bytes memory passengers = new bytes(0);
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidNumPassengers.selector, 0));
        this.drive(passengers); // intentionally large;  no method is exposed to estimate cost of internal function
    }

    function test_drive_Bus_InvalidPassenger_too_many_passengers(uint8 _numPassengers) public {
        vm.assume(_numPassengers > 0); // assume passengers exceeds the queue capacity
        queue.maxNumPassengers = _numPassengers - 1;

        bytes memory passengers = new bytes(uint128(_numPassengers) * PASSENGER_SIZE);
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidNumPassengers.selector, _numPassengers));
        this.drive(passengers);
    }

    function test_drive_Bus_InvalidPassenger_exceeds_qLength() public {
        queue.maxNumPassengers = uint8(QUEUE_CAPACITY + 2); // ensure the queue is not full
        bytes memory passengers = new bytes((QUEUE_CAPACITY + 1) * PASSENGER_SIZE);
        vm.expectRevert(abi.encodeWithSelector(BusLib.Bus_InvalidNumPassengers.selector, QUEUE_CAPACITY + 1));
        this.drive(passengers);
    }

    function test_drive_Passenger_InvalidPassenger_passenger_payload_extra_bytes(
        uint8 _seed,
        uint8 _numPassengers,
        bytes memory _extraBytes
    ) public {
        vm.assume(_extraBytes.length > 0); // assume extraBytes is not empty
        vm.assume(_numPassengers > 0 && _numPassengers <= MAX_NUM_PASSENGERS); // ensure at least one passenger but avoid Bus_BusFull

        queue.maxNumPassengers = MAX_NUM_PASSENGERS;
        queue.busFare = 100;
        queue.busAndNativeDropFare = 200;

        (BusPassenger[] memory passengerPayloads, bytes memory passengers, ) = PassengerUtils.createPassengers(
            _seed,
            _numPassengers
        );
        for (uint256 i = 0; i < _numPassengers; i++) {
            this.ride(1, passengerPayloads[i]);
        }
        passengers = abi.encodePacked(passengers, new bytes(1)); // add extra bytes to the passengers payload
        vm.expectRevert(BusCodec.BusCodec_InvalidPassengersBytesLength.selector);
        this.drive(passengers);
    }

    // Avoid Error 1227: Index range access is only supported for dynamic calldata arrays.
    function removeBytes(
        bytes memory _input,
        uint8 _bytesToRemove
    ) internal pure returns (bytes memory truncatedBytes) {
        truncatedBytes = new bytes(_input.length - _bytesToRemove);
        // copy all but the last byte
        for (uint256 i = 0; i < _input.length - _bytesToRemove; i++) {
            truncatedBytes[i] = _input[i];
        }
    }

    function test_drive_Passenger_InvalidPassenger_passenger_payload_not_enough_bytes(
        uint8 _seed,
        uint8 _numPassengers
    ) public {
        vm.assume(_numPassengers > 0 && _numPassengers <= MAX_NUM_PASSENGERS); // ensure at least one passenger but avoid Bus_BusFull

        queue.maxNumPassengers = MAX_NUM_PASSENGERS;
        queue.busFare = 100;
        queue.busAndNativeDropFare = 200;

        (BusPassenger[] memory passengerPayloads, bytes memory passengers, ) = PassengerUtils.createPassengers(
            _seed,
            _numPassengers
        );
        for (uint256 i = 0; i < _numPassengers; i++) {
            this.ride(1, passengerPayloads[i]);
        }
        for (uint8 i = 1; i < PASSENGER_SIZE; i++) {
            bytes memory malformedPassengers = removeBytes(passengers, i); // remove one bytes from the passengers payload
            vm.expectRevert(BusCodec.BusCodec_InvalidPassengersBytesLength.selector);
            this.drive(malformedPassengers);
        }
    }

    function removePassengerFromCount(bytes memory _passengers) internal pure returns (bytes memory newPassengers) {
        uint8 numPassengers = uint8(_passengers[0]) - 1;
        newPassengers = new bytes(_passengers.length);
        newPassengers[0] = bytes1(numPassengers);
        for (uint256 i = 1; i < _passengers.length; i++) {
            newPassengers[i] = _passengers[i];
        }
    }

    function test_drive_Bus_InvalidPassenger_bad_hash(uint8 _seed, uint8 _numPassengers, uint8 _indexToCorrupt) public {
        vm.assume(_numPassengers > 1 && _numPassengers <= MAX_NUM_PASSENGERS);
        vm.assume(_indexToCorrupt < _numPassengers);

        queue.maxNumPassengers = MAX_NUM_PASSENGERS;
        queue.busFare = 100;
        queue.busAndNativeDropFare = 200;

        (BusPassenger[] memory passengerPayloads, bytes memory passengers, ) = PassengerUtils.createMalformedPassengers(
            _seed,
            _numPassengers,
            _indexToCorrupt
        );
        for (uint256 i = 0; i < _numPassengers; i++) {
            this.ride(1, passengerPayloads[i]);
        }
        bool invalidPassengerCaught = false;
        try this.drive(passengers) {} catch (bytes memory reason) {
            if (reason.length >= 4) {
                bytes4 selector;

                // Extract the selector
                assembly {
                    selector := mload(add(reason, 0x20))
                }
                if (selector == BusLib.Bus_InvalidPassenger.selector) {
                    invalidPassengerCaught = true;
                } else {
                    revert("Unexpected Error");
                }
            }
        }
        assertTrue(invalidPassengerCaught);
    }

    function sliceBytes(bytes memory data, uint256 start, uint256 length) public pure returns (bytes memory) {
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = data[i + start];
        }
        return result;
    }

    function test_drive(uint8 _seed, uint8 _busFare, uint8 _busAndNativeDropFare, uint8 _numPassengers) public {
        vm.assume(_busFare > 0); // assume the BusQueue has a busFare
        vm.assume(_busAndNativeDropFare > _busFare); // assume the busAndNativeDropFare is more than the regular bus fare
        vm.assume(_numPassengers > 0 && _numPassengers <= MAX_NUM_PASSENGERS); // ensure at least one passenger but avoid Bus_BusFull

        queue.maxNumPassengers = MAX_NUM_PASSENGERS;
        queue.busFare = _busFare;
        queue.busAndNativeDropFare = _busAndNativeDropFare;

        (BusPassenger[] memory passengerPayloads, bytes memory passengers, uint128 totalNativeDrops) = PassengerUtils
            .createPassengers(_seed, _numPassengers);

        for (uint256 i = 0; i < _numPassengers; i++) {
            this.ride(1, passengerPayloads[i]);
        }

        Bus memory bus = this.drive(passengers);

        assertEq(bus.startTicketId, 0);
        assertEq(bus.numPassengers, _numPassengers);
        assertEq(bus.totalNativeDrops, totalNativeDrops);

        // check the passengers last, as it takes linear time
        assertEq(bus.passengersBytes.length / PASSENGER_SIZE, _numPassengers);

        MockBusCodec mockBusCodec = new MockBusCodec();
        uint256 numDecodedPassengers = bus.passengersBytes.length / PASSENGER_SIZE;
        for (uint256 i = 0; i < numDecodedPassengers; i++) {
            BusPassenger memory decodedPassenger = mockBusCodec.decodePassenger(
                sliceBytes(bus.passengersBytes, i * PASSENGER_SIZE, PASSENGER_SIZE)
            );
            assertEq(decodedPassenger.assetId, passengerPayloads[i].assetId);
            assertEq(decodedPassenger.receiver, passengerPayloads[i].receiver);
            assertEq(decodedPassenger.amountSD, passengerPayloads[i].amountSD);
            assertEq(decodedPassenger.nativeDrop, passengerPayloads[i].nativeDrop);
        }
    }
}

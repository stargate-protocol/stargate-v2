// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

struct BusPassenger {
    uint16 assetId;
    bytes32 receiver;
    uint64 amountSD;
    bool nativeDrop;
}

/// @title A library for encoding and decoding Bus messages.
/// @dev Each bus contains one more more passengers.
/// @dev A passenger contains the payload for one transfer.
library BusCodec {
    uint8 internal constant MSG_TYPE_BUS = 2;

    // Bytes offsets for the passenger payload
    uint256 internal constant ASSET_ID_OFFSET = 2;
    uint256 internal constant RECEIVER_OFFSET = 34;
    uint256 internal constant AMOUNT_SD_OFFSET = 42;
    uint256 internal constant NATIVE_DROP_OFFSET = 43;
    uint256 internal constant PASSENGER_BYTES_LENGTH = NATIVE_DROP_OFFSET;

    // Bytes offsets for the header payload
    uint256 internal constant MSG_TYPE_BYTES_OFFSET = 1;
    uint256 internal constant NATIVE_DROP_AMOUNT_TOTAL_OFFSET = 17;
    uint256 internal constant NATIVE_DROP_AMOUNT_OFFSET = 33;
    uint256 internal constant HEADER_BYTES_LENGTH = NATIVE_DROP_AMOUNT_OFFSET;

    error BusCodec_InvalidBusBytesLength();
    error BusCodec_InvalidMessage();
    error BusCodec_InvalidPassenger();
    error BusCodec_InvalidPassengersBytesLength();

    // ---------------------------------- Passenger Functions ------------------------------------------

    function encodePassenger(BusPassenger memory _passenger) internal pure returns (bytes memory passengerBytes) {
        passengerBytes = abi.encodePacked(
            _passenger.assetId,
            _passenger.receiver,
            _passenger.amountSD,
            _passenger.nativeDrop
        );
    }

    function decodePassenger(bytes calldata _passengerBytes) internal pure returns (BusPassenger memory) {
        uint16 assetId = uint16(bytes2(_passengerBytes[:ASSET_ID_OFFSET]));
        bytes32 receiver = bytes32(_passengerBytes[ASSET_ID_OFFSET:RECEIVER_OFFSET]);
        uint64 amountSD = uint64(bytes8(_passengerBytes[RECEIVER_OFFSET:AMOUNT_SD_OFFSET]));
        bool nativeDrop = uint8(bytes1(_passengerBytes[AMOUNT_SD_OFFSET:NATIVE_DROP_OFFSET])) == 1;

        return BusPassenger({ assetId: assetId, receiver: receiver, amountSD: amountSD, nativeDrop: nativeDrop });
    }

    // ---------------------------------- Bus Functions ------------------------------------------

    /// @notice Checks if the message is a bus message.
    function isBus(bytes calldata _message) internal pure returns (bool) {
        if (_message.length < HEADER_BYTES_LENGTH) revert BusCodec_InvalidMessage();
        return uint8(_message[0]) == MSG_TYPE_BUS;
    }

    /// @notice Extracts the number of passengers on the bus.
    function getNumPassengers(bytes calldata _passengersBytes) internal pure returns (uint8) {
        uint256 passengersBytesLength = _passengersBytes.length;
        if (passengersBytesLength % PASSENGER_BYTES_LENGTH != 0) revert BusCodec_InvalidPassengersBytesLength();

        return SafeCast.toUint8((passengersBytesLength) / PASSENGER_BYTES_LENGTH);
    }

    /// @notice Encodes a Bus message.
    /// @param _numNativeDrops The total number of native drops requested by passengers on the bus.
    /// @dev Since each passenger can only request whether or not to drop native gas (and not the native drop amount),
    /// @dev _numNativeDrops <= the number of passengers on the Bus.
    /// @param _nativeDropAmount The amount destination gas included in the delivery.
    /// @param _nativeDropAmount is the same for each participating passenger.
    /// @param _passengersBytes The passengers payload, which contains one or more passengers.
    /// @return busBytes The encoded Bus message.
    function encodeBus(
        uint128 _numNativeDrops, // the number of passengers whom have requested a native drop on the destination
        uint128 _nativeDropAmount, // amount per drop
        bytes memory _passengersBytes
    ) internal pure returns (bytes memory busBytes) {
        busBytes = abi.encodePacked(MSG_TYPE_BUS, _numNativeDrops, _nativeDropAmount, _passengersBytes);
    }

    function decodeBus(
        bytes calldata _busBytes
    ) internal pure returns (uint128 totalNativeDrops, uint128 nativeDropAmount, BusPassenger[] memory busPassengers) {
        // gas savings by loading to memory
        uint256 busBytesLength = _busBytes.length;

        // Step 0: check payload length
        if (busBytesLength < HEADER_BYTES_LENGTH) revert BusCodec_InvalidBusBytesLength();

        // Step 1: decode nativeDrop details
        totalNativeDrops = uint128(bytes16(_busBytes[MSG_TYPE_BYTES_OFFSET:NATIVE_DROP_AMOUNT_TOTAL_OFFSET]));
        nativeDropAmount = uint128(bytes16(_busBytes[NATIVE_DROP_AMOUNT_TOTAL_OFFSET:NATIVE_DROP_AMOUNT_OFFSET]));

        // Step 2: determine the number of passengers in the bus.
        uint256 numPassengers = (busBytesLength - HEADER_BYTES_LENGTH) / PASSENGER_BYTES_LENGTH;

        // Step 3: Initialize the list of passenger details
        busPassengers = new BusPassenger[](numPassengers);

        // Step 4: Set the cursor to the start of the 'busPassengers'
        uint256 cursor = HEADER_BYTES_LENGTH;

        // Step 5: Iterate the 'busPassengers' and decode each passenger
        for (uint8 i = 0; i < numPassengers; i++) {
            busPassengers[i] = decodePassenger(_busBytes[cursor:cursor + PASSENGER_BYTES_LENGTH]);
            cursor += PASSENGER_BYTES_LENGTH;
        }
    }

    function parsePassengers(
        bytes calldata _passengersBytes,
        bytes32 _previousHash
    ) internal pure returns (uint8 totalNativeDrops, bytes32 lastHash) {
        lastHash = _previousHash;
        // iterate passengers
        for (uint256 i = 0; i < _passengersBytes.length; i += PASSENGER_BYTES_LENGTH) {
            // get the current passenger
            bytes calldata passengerBytes = _passengersBytes[i:i + PASSENGER_BYTES_LENGTH];

            // update the lastHash
            lastHash = keccak256(abi.encodePacked(lastHash, passengerBytes));

            // update total native drops
            bool hasNativeDrop = uint8(passengerBytes[NATIVE_DROP_OFFSET - 1]) == 1;
            if (hasNativeDrop) totalNativeDrops++;
        }
    }
}

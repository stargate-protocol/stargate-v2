// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { BusCodec, BusPassenger } from "../../../../src/libs/BusCodec.sol";

import { TokenMsgUtils } from "./TokenMsgUtils.sol";

/// @title PassengerUtils
/// @notice Helper functions for creating passengers
library PassengerUtils {
    /// @dev createPassengers creates passengers for a bus
    /// @param _seed the seed for generating random numbers
    /// @param _numPassengers the number of passengers to create
    function createPassengers(
        uint32 _seed,
        uint8 _numPassengers
    )
        internal
        view
        returns (BusPassenger[] memory passengerPayloads, bytes memory passengersBytes, uint128 totalNativeDrops)
    {
        passengerPayloads = new BusPassenger[](_numPassengers);
        totalNativeDrops = 0;

        for (uint8 i = 0; i < _numPassengers; i++) {
            passengerPayloads[i] = TokenMsgUtils.createPseudorandomBusPassenger(_seed + i);
            if (passengerPayloads[i].nativeDrop) totalNativeDrops++;

            bytes memory passengerBytes = BusCodec.encodePassenger(passengerPayloads[i]);
            passengersBytes = abi.encodePacked(passengersBytes, passengerBytes);
        }
    }

    /// @dev createMalformedPassengers creates malformed passengers for a bus
    /// @param _seed the seed for generating random numbers
    /// @param _numPassengers the number of passengers to create
    /// @param _indexToCorrupt the index of the passenger to corrupt
    function createMalformedPassengers(
        uint32 _seed,
        uint8 _numPassengers,
        uint8 _indexToCorrupt
    )
        internal
        view
        returns (BusPassenger[] memory passengerPayloads, bytes memory passengersBytes, uint128 totalNativeDrops)
    {
        passengerPayloads = new BusPassenger[](_numPassengers);
        totalNativeDrops = 0;

        for (uint8 i = 0; i < _numPassengers; i++) {
            passengerPayloads[i] = TokenMsgUtils.createPseudorandomBusPassenger(_seed + i);
            if (passengerPayloads[i].nativeDrop) totalNativeDrops++;

            bytes memory passengerBytes = BusCodec.encodePassenger(passengerPayloads[i]);
            passengersBytes = abi.encodePacked(passengersBytes, passengerBytes);

            // corrupt the nativeDrop by inversing the value
            if (i == _indexToCorrupt) {
                passengerPayloads[i].nativeDrop = !passengerPayloads[i].nativeDrop;
            }
        }
    }
}

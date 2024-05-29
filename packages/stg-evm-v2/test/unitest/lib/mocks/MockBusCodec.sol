// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { BusPassenger, BusCodec } from "../../../../src/libs/BusCodec.sol";

/// @dev MockBusCodec is a mock contract wrapper for BusCodec intended for testing purposes only.
contract MockBusCodec {
    function encodePassenger(BusPassenger memory _passenger) public pure returns (bytes memory) {
        return BusCodec.encodePassenger(_passenger);
    }

    function decodePassenger(bytes calldata _passengerBytes) public pure returns (BusPassenger memory passenger) {
        return BusCodec.decodePassenger(_passengerBytes);
    }

    function isBus(bytes calldata _message) public pure returns (bool) {
        return BusCodec.isBus(_message);
    }

    function getNumPassengers(bytes calldata _passengersBytes) public pure returns (uint8 numPassengers) {
        return BusCodec.getNumPassengers(_passengersBytes);
    }

    function encodeBus(
        uint128 _nativeDropAmountTotal,
        uint128 _nativeDropAmount,
        bytes memory _passengersBytes
    ) public pure returns (bytes memory) {
        return BusCodec.encodeBus(_nativeDropAmountTotal, _nativeDropAmount, _passengersBytes);
    }

    function decodeBus(
        bytes calldata _busBytes
    )
        public
        pure
        returns (uint128 nativeDropAmountTotal, uint128 nativeDropAmount, BusPassenger[] memory busPassengers)
    {
        return BusCodec.decodeBus(_busBytes);
    }
}

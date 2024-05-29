// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { TaxiCodec } from "../../../../src/libs/TaxiCodec.sol";

/// @dev MockTaxiCodec is a mock contract wrapper for TaxiCodec intended for testing purposes only.
contract MockTaxiCodec {
    function isTaxi(bytes calldata _message) public pure returns (bool) {
        return TaxiCodec.isTaxi(_message);
    }

    function encodeTaxi(
        address _sender,
        uint16 _assetId,
        bytes32 _receiver,
        uint64 _amountSD,
        bytes calldata _composeMsg
    ) public pure returns (bytes memory _message) {
        return TaxiCodec.encodeTaxi(_sender, _assetId, _receiver, _amountSD, _composeMsg);
    }

    function decodeTaxi(
        bytes calldata _taxiBytes
    ) public pure returns (uint16 assetId, bytes32 receiver, uint64 amountSD, bytes memory composeMsg) {
        return TaxiCodec.decodeTaxi(_taxiBytes);
    }
}

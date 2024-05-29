// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { AddressCast } from "./AddressCast.sol";

library TaxiCodec {
    error TaxiCodec_InvalidMessage();

    uint8 internal constant MSG_TYPE_TAXI = 1;

    uint256 internal constant MSG_TYPE_OFFSET = 1;
    uint256 internal constant ASSET_ID_OFFSET = 3;
    uint256 internal constant RECEIVER_OFFSET = 35;
    uint256 internal constant AMOUNT_SD_OFFSET = 43;

    function isTaxi(bytes calldata _message) internal pure returns (bool) {
        if (_message.length < AMOUNT_SD_OFFSET) revert TaxiCodec_InvalidMessage();
        return uint8(_message[0]) == MSG_TYPE_TAXI;
    }

    function encodeTaxi(
        address _sender,
        uint16 _assetId,
        bytes32 _receiver,
        uint64 _amountSD,
        bytes calldata _composeMsg
    ) internal pure returns (bytes memory _taxiBytes) {
        _taxiBytes = abi.encodePacked(
            MSG_TYPE_TAXI,
            _assetId,
            _receiver,
            _amountSD,
            // @dev Remote chains will want to know the composed function caller ie. msg.sender on the src.
            _composeMsg.length > 0 ? abi.encodePacked(AddressCast.toBytes32(_sender), _composeMsg) : _composeMsg
        );
    }

    function decodeTaxi(
        bytes calldata _taxiBytes
    ) internal pure returns (uint16 assetId, bytes32 receiver, uint64 amountSD, bytes memory composeMsg) {
        assetId = uint16(bytes2(_taxiBytes[MSG_TYPE_OFFSET:ASSET_ID_OFFSET]));
        receiver = bytes32(_taxiBytes[ASSET_ID_OFFSET:RECEIVER_OFFSET]);
        amountSD = uint64(bytes8(_taxiBytes[RECEIVER_OFFSET:AMOUNT_SD_OFFSET]));
        composeMsg = _taxiBytes[AMOUNT_SD_OFFSET:]; // This has had the msg.sender encoded into the original composeMsg
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { CreditMsgCodec, CreditBatch } from "../../../../src/libs/CreditMsgCodec.sol";

/// @dev MockCreditMsgCodec is a mock contract wrapper for CreditMsgCodec intended for testing purposes only.
contract MockCreditMsgCodec {
    /// @dev public encode(...) allows memory or calldata for _creditBatches;  useful for testing
    function encode(
        CreditBatch[] calldata _creditBatches,
        uint256 _creditNum
    ) public pure returns (bytes memory message) {
        return CreditMsgCodec.encode(_creditBatches, _creditNum);
    }

    /// @dev public decode(...) allows memory or calldata for _message;  useful for testing
    function decode(bytes calldata _message) public pure returns (CreditBatch[] memory creditBatches) {
        bytes calldata message = _message;
        return CreditMsgCodec.decode(message);
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IStargateFeeLib, FeeParams } from "../../src/interfaces/IStargateFeeLib.sol";

/// @title FeeLibMock mock.
/// @dev Mock IStargateFeeLib implementation, used for testing only.
contract FeeLibMock is IStargateFeeLib {
    function applyFee(FeeParams calldata _params) external pure returns (uint64 amountOutSD) {
        amountOutSD = _params.amountInSD;
    }

    function applyFeeView(FeeParams calldata _params) external pure returns (uint64 amountOutSD) {
        amountOutSD = _params.amountInSD;
    }
}

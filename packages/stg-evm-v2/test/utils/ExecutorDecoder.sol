// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ExecutorOptions } from "@layerzerolabs/lz-evm-protocol-v2/contracts/messagelib/libs/ExecutorOptions.sol";

library ExecutorDecoder {
    using ExecutorOptions for bytes;

    error Executor_NoOptions();
    error Executor_UnsupportedOptionType(uint8 optionType);
    error Executor_InvalidExecutorOptions(uint256 cursor);
    error Executor_ZeroLzReceiveGasProvided();

    function decodeExecutorOptions(bytes calldata _options) public pure returns (uint256 dstAmount, uint256 totalGas) {
        if (_options.length == 0) {
            revert Executor_NoOptions();
        }

        uint256 cursor = 2; // skip the options type
        totalGas = 0;

        uint256 lzReceiveGas;
        while (cursor < _options.length) {
            (uint8 optionType, bytes calldata option, uint256 newCursor) = _options.nextExecutorOption(cursor);
            cursor = newCursor;
            if (optionType == ExecutorOptions.OPTION_TYPE_LZRECEIVE) {
                (uint128 gas, uint128 value) = ExecutorOptions.decodeLzReceiveOption(option);
                dstAmount += value;
                lzReceiveGas += gas;
            } else if (optionType == ExecutorOptions.OPTION_TYPE_NATIVE_DROP) {
                (uint128 nativeDropAmount, ) = ExecutorOptions.decodeNativeDropOption(option);
                dstAmount += nativeDropAmount;
            } else if (optionType == ExecutorOptions.OPTION_TYPE_LZCOMPOSE) {
                (, uint128 gas, uint128 value) = ExecutorOptions.decodeLzComposeOption(option);
                dstAmount += value;
                totalGas += gas;
            } else {
                revert Executor_UnsupportedOptionType(optionType);
            }
        }
        if (cursor != _options.length) revert Executor_InvalidExecutorOptions(cursor);
        if (lzReceiveGas == 0) revert Executor_ZeroLzReceiveGasProvided();
        totalGas += lzReceiveGas;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MockOFTBase } from "./MockOFTBase.sol";

contract MockOFT is MockOFTBase {
    constructor() MockOFTBase(address(this)) {}

    function sendFrom(
        address from,
        uint16 dstChainId,
        bytes calldata toAddress,
        uint256 amount,
        address payable refundAddress,
        address zroPaymentAddress,
        bytes calldata adapterParams
    ) external payable {
        emit MockEvent(
            keccak256(
                abi.encodeWithSignature(
                    "sendFrom(address,uint16,bytes,uint256,address,address,bytes)",
                    msg.value,
                    from,
                    dstChainId,
                    toAddress,
                    amount,
                    refundAddress,
                    zroPaymentAddress,
                    adapterParams
                )
            )
        );
    }

    function sendFrom(
        address from,
        uint16 dstChainId,
        bytes32 toAddress,
        uint256 amount,
        LzCallParams calldata callParams
    ) external payable {
        emit MockEvent(
            keccak256(
                abi.encodeWithSignature(
                    "sendFrom(address,uint16,bytes32,uint256,(address,address,bytes))",
                    msg.value,
                    from,
                    dstChainId,
                    toAddress,
                    amount,
                    callParams
                )
            )
        );
    }

    function sendFrom(
        address from,
        uint16 dstChainId,
        bytes32 toAddress,
        uint256 amount,
        uint256 minAmount,
        LzCallParams calldata callParams
    ) external payable {
        emit MockEvent(
            keccak256(
                abi.encodeWithSignature(
                    "sendFrom(address,uint16,bytes32,uint256,uint256,(address,address,bytes))",
                    msg.value,
                    from,
                    dstChainId,
                    toAddress,
                    amount,
                    minAmount,
                    callParams
                )
            )
        );
    }
}

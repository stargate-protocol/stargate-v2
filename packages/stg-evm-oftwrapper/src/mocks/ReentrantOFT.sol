// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ICommonOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/ICommonOFT.sol";
import { FeeObj } from "../interfaces/IOFTWrapper.sol";
import { OFTSenderV1Facet } from "../facets/OFTSenderV1Facet.sol";
import { OFTSenderV2Facet } from "../facets/OFTSenderV2Facet.sol";
import { MockOFTBase } from "./MockOFTBase.sol";

contract ReentrantOFT is MockOFTBase {
    address internal immutable oftSender;

    constructor(address _oftSender) MockOFTBase(address(this)) {
        oftSender = _oftSender;
    }

    function sendFrom(
        address from,
        uint16 dstChainId,
        bytes calldata toAddress,
        uint256 amount,
        address payable refundAddress,
        address zroPaymentAddress,
        bytes calldata adapterParams
    ) external payable {
        FeeObj memory feeObj = FeeObj({ callerBps: 0, caller: address(0x00), partnerId: 0xF0F0 });
        OFTSenderV1Facet(oftSender).sendOFT(
            from,
            dstChainId,
            toAddress,
            amount,
            amount,
            refundAddress,
            zroPaymentAddress,
            adapterParams,
            feeObj
        );
    }

    function sendFrom(
        address from,
        uint16 dstChainId,
        bytes32 toAddress,
        uint256 amount,
        LzCallParams calldata callParams
    ) external payable {
        FeeObj memory feeObj = FeeObj({ callerBps: 0, caller: address(0x00), partnerId: 0xF0F0 });
        ICommonOFT.LzCallParams memory lzCallParams = LzCallParams({
            refundAddress: callParams.refundAddress,
            zroPaymentAddress: callParams.zroPaymentAddress,
            adapterParams: callParams.adapterParams
        });
        OFTSenderV2Facet(oftSender).sendOFTV2(from, dstChainId, toAddress, amount, amount, lzCallParams, feeObj);
    }

    function sendFrom(
        address from,
        uint16 dstChainId,
        bytes32 toAddress,
        uint256 amount,
        uint256 minAmount,
        LzCallParams calldata callParams
    ) external payable {
        FeeObj memory feeObj = FeeObj({ callerBps: 0, caller: address(0x00), partnerId: 0xF0F0 });
        ICommonOFT.LzCallParams memory lzCallParams = LzCallParams({
            refundAddress: callParams.refundAddress,
            zroPaymentAddress: callParams.zroPaymentAddress,
            adapterParams: callParams.adapterParams
        });
        OFTSenderV2Facet(oftSender).sendOFTV2(from, dstChainId, toAddress, amount, minAmount, lzCallParams, feeObj);
    }
}

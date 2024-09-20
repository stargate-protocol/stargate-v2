// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { IOFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import { MessagingFee as MessagingFeeEpv2, SendParam as SendParamEpv2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

interface IOFTWrapper {
    event CallerBpsCapSet(uint256 bps);
    event DefaultBpsSet(uint256 bps);
    event OFTBpsSet(address indexed token, uint256 bps);
    event WrapperFees(bytes2 indexed partnerId, address token, uint256 wrapperFee, uint256 callerFee);
    event WrapperFeeWithdrawn(address indexed oft, address to, uint256 amount);

    struct FeeObj {
        uint256 callerBps;
        address caller;
        bytes2 partnerId;
    }

    struct QuoteInput {
        uint8 version;
        address token;
        address adapter;
        uint16 dstEid;
        uint256 amountLD;
        uint256 minAmountLD;
        bytes32 toAddress;
        uint256 nativeDrop;
    }

    struct QuoteFee {
        string fee;
        uint256 amount;
        address token;
    }

    struct QuoteFeeDetail {
        string fee;
        int256 amount;
        address token;
    }

    struct OFTQuoteResult {
        QuoteResult quoteResult;
        uint256 amountAfterWrapperFees;
        uint256 fees;
    }

    struct QuoteResult {
        uint256 srcAmount;
        uint256 amountReceivedLD;
        uint256 srcAmountMin;
        uint256 srcAmountMax;
        uint256 confirmations;
        QuoteFee[] fees;
        QuoteFeeDetail[] oftFeeDetails;
    }

    function sendOFT(
        address _oft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint _amount,
        uint256 _minAmount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external payable;

    function sendProxyOFT(
        address _proxyOft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external payable;

    function sendNativeOFT(
        address _nativeOft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint _amount,
        uint256 _minAmount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external payable;

    function sendOFTV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable;

    function sendOFTFeeV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable;

    function sendProxyOFTV2(
        address _proxyOft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable;

    function sendProxyOFTFeeV2(
        address _proxyOft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable;

    function sendNativeOFTFeeV2(
        address _nativeOft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable;

    function sendOFTEpv2(
        address _oft,
        SendParamEpv2 calldata _sendParam,
        MessagingFeeEpv2 calldata _fee,
        address _refundAddress,
        FeeObj calldata _feeObj
    ) external payable;

    function sendOFTAdapterEpv2(
        address _adapterOFT,
        SendParamEpv2 calldata _sendParam,
        MessagingFeeEpv2 calldata _fee,
        address _refundAddress,
        FeeObj calldata _feeObj
    ) external payable;

    function getAmountAndFees(
        address _oft,
        uint256 _amount,
        uint256 _callerBps
    ) external view returns (uint256 amount, uint256 wrapperFee, uint256 callerFee);

    function estimateSendFee(
        address _oft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint _amount,
        bool _useZro,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external view returns (uint nativeFee, uint zroFee);

    function estimateSendFeeV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        bool _useZro,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external view returns (uint nativeFee, uint zroFee);

    function estimateSendFeeEpv2(
        address _oft,
        SendParamEpv2 calldata _sendParam,
        bool _payInLzToken,
        FeeObj calldata _feeObj
    ) external view returns (MessagingFeeEpv2 memory);

    function quote(
        QuoteInput calldata _input,
        FeeObj calldata _feeObj
    ) external view returns (QuoteResult memory result);
}

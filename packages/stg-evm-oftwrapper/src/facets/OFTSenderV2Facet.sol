// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IOFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import { ICommonOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/ICommonOFT.sol";
import { IOFT as IOFTV1 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { INativeOFT } from "../interfaces/INativeOFT.sol";
import { IOFTWithFee } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/IOFTWithFee.sol";
import { LibOFTFee } from "../libraries/LibOFTFee.sol";
import { FeeObj } from "../interfaces/IOFTWrapper.sol";

contract OFTSenderV2Facet is ReentrancyGuard {
    function sendOFTV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        ICommonOFT.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        uint256 amountToSwap = LibOFTFee._getAmountAndPayFee(_oft, _amount, _minAmount, _feeObj);
        IOFTV2(_oft).sendFrom{ value: msg.value }(msg.sender, _dstChainId, _toAddress, amountToSwap, _callParams);
    }

    function sendOFTFeeV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        ICommonOFT.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        uint256 amountToSwap = LibOFTFee._getAmountAndPayFee(_oft, _amount, _minAmount, _feeObj);
        IOFTWithFee(_oft).sendFrom{ value: msg.value }(
            msg.sender,
            _dstChainId,
            _toAddress,
            amountToSwap,
            _minAmount,
            _callParams
        );
    }

    function sendProxyOFTV2(
        address _proxyOft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        ICommonOFT.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        address token = IOFTV2(_proxyOft).token();
        uint256 amountToSwap = LibOFTFee._getAmountAndPayFeeProxy(token, _amount, _minAmount, _feeObj);

        // approve proxy to spend tokens
        IOFTV1(token).approve(_proxyOft, amountToSwap);
        IOFTV2(_proxyOft).sendFrom{ value: msg.value }(
            address(this),
            _dstChainId,
            _toAddress,
            amountToSwap,
            _callParams
        );

        // reset allowance if sendFrom() does not consume full amount
        if (IOFTV1(token).allowance(address(this), _proxyOft) > 0) IOFTV1(token).approve(_proxyOft, 0);
    }

    function sendProxyOFTFeeV2(
        address _proxyOft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        ICommonOFT.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        address token = IOFTV2(_proxyOft).token();
        uint256 amountToSwap = LibOFTFee._getAmountAndPayFeeProxy(token, _amount, _minAmount, _feeObj);

        // approve proxy to spend tokens
        IOFTV1(token).approve(_proxyOft, amountToSwap);
        IOFTWithFee(_proxyOft).sendFrom{ value: msg.value }(
            address(this),
            _dstChainId,
            _toAddress,
            amountToSwap,
            _minAmount,
            _callParams
        );

        // reset allowance if sendFrom() does not consume full amount
        if (IOFTV1(token).allowance(address(this), _proxyOft) > 0) IOFTV1(token).approve(_proxyOft, 0);
    }

    function sendNativeOFTFeeV2(
        address _nativeOft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        ICommonOFT.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        require(msg.value >= _amount, "OFTWrapper: not enough value sent");

        INativeOFT(_nativeOft).deposit{ value: _amount }();
        uint256 amountToSwap = LibOFTFee._getAmountAndPayFeeNative(_nativeOft, _amount, _minAmount, _feeObj);
        IOFTWithFee(_nativeOft).sendFrom{ value: msg.value - _amount }(
            address(this),
            _dstChainId,
            _toAddress,
            amountToSwap,
            _minAmount,
            _callParams
        );
    }

    function estimateSendFeeV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bool _useZro,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        (uint256 amount, , ) = LibOFTFee._getAmountAndFees(_oft, _amount, _feeObj.callerBps);

        return IOFTV2(_oft).estimateSendFee(_dstChainId, _toAddress, amount, _useZro, _adapterParams);
    }
}

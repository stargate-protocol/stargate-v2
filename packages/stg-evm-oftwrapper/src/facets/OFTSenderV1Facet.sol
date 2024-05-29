// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { LibOFTFee } from "../libraries/LibOFTFee.sol";
import { IOFT as IOFTV1 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { INativeOFT } from "../interfaces/INativeOFT.sol";
import { FeeObj } from "../interfaces/IOFTWrapper.sol";

contract OFTSenderV1Facet is ReentrancyGuard {
    function sendOFT(
        address _oft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        uint256 amountToSwap = LibOFTFee._getAmountAndPayFee(_oft, _amount, _minAmount, _feeObj);
        IOFTV1(_oft).sendFrom{ value: msg.value }(
            msg.sender,
            _dstChainId,
            _toAddress,
            amountToSwap,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams
        );
    }

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
    ) external payable nonReentrant {
        address token = IOFTV1(_proxyOft).token();
        {
            uint256 amountToSwap = LibOFTFee._getAmountAndPayFeeProxy(token, _amount, _minAmount, _feeObj);

            // approve proxy to spend tokens
            IOFTV1(token).approve(_proxyOft, amountToSwap);
            IOFTV1(_proxyOft).sendFrom{ value: msg.value }(
                address(this),
                _dstChainId,
                _toAddress,
                amountToSwap,
                _refundAddress,
                _zroPaymentAddress,
                _adapterParams
            );
        }

        // reset allowance if sendFrom() does not consume full amount
        if (IOFTV1(token).allowance(address(this), _proxyOft) > 0) IOFTV1(token).approve(_proxyOft, 0);
    }

    function sendNativeOFT(
        address _nativeOft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        require(msg.value >= _amount, "OFTWrapper: not enough value sent");

        INativeOFT(_nativeOft).deposit{ value: _amount }();
        uint256 amountToSwap = LibOFTFee._getAmountAndPayFeeNative(_nativeOft, _amount, _minAmount, _feeObj);
        IOFTV1(_nativeOft).sendFrom{ value: msg.value - _amount }(
            address(this),
            _dstChainId,
            _toAddress,
            amountToSwap,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams
        );
    }

    function estimateSendFee(
        address _oft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        bool _useZro,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        (uint256 amount, , ) = LibOFTFee._getAmountAndFees(_oft, _amount, _feeObj.callerBps);

        return IOFTV1(_oft).estimateSendFee(_dstChainId, _toAddress, amount, _useZro, _adapterParams);
    }
}

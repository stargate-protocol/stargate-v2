// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IOFT as IOFTV1 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { FeeObj, WrapperFees } from "../interfaces/IOFTWrapper.sol";
import { AppStorage } from "../AppStorage.sol";

library LibOFTFee {
    using SafeERC20 for IOFTV1;

    function appStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_UINT = 2 ** 256 - 1; // indicates a bp fee of 0 that overrides the default bps

    function _getAmountAndFees(
        address _token, // will be the token on proxies, and the oft on non-proxy
        uint256 _amount,
        uint256 _callerBps
    ) internal view returns (uint256 amount, uint256 wrapperFee, uint256 callerFee) {
        uint256 wrapperBps;
        AppStorage storage s = appStorage();

        if (s.oftBps[_token] == MAX_UINT) {
            wrapperBps = 0;
        } else if (s.oftBps[_token] > 0) {
            wrapperBps = s.oftBps[_token];
        } else {
            wrapperBps = s.defaultBps;
        }

        require(wrapperBps + _callerBps < BPS_DENOMINATOR, "OFTWrapper: Fee bps >= 100%");

        wrapperFee = wrapperBps > 0 ? (_amount * wrapperBps) / BPS_DENOMINATOR : 0;
        callerFee = _callerBps > 0 ? (_amount * _callerBps) / BPS_DENOMINATOR : 0;
        amount = wrapperFee > 0 || callerFee > 0 ? _amount - wrapperFee - callerFee : _amount;
    }

    function _getAmountAndPayFeeProxy(
        address _token,
        uint256 _amount,
        uint256 _minAmount,
        FeeObj calldata _feeObj
    ) internal returns (uint256) {
        (uint256 amountToSwap, uint256 wrapperFee, uint256 callerFee) = _getAmountAndFees(
            _token,
            _amount,
            _feeObj.callerBps
        );
        require(amountToSwap >= _minAmount && amountToSwap > 0, "OFTWrapper: not enough amountToSwap");

        // pay wrapper and move proxy tokens to contract
        IOFTV1(_token).safeTransferFrom(msg.sender, address(this), amountToSwap + wrapperFee);
        if (callerFee > 0) IOFTV1(_token).safeTransferFrom(msg.sender, _feeObj.caller, callerFee); // pay caller

        emit WrapperFees(_feeObj.partnerId, _token, wrapperFee, callerFee);

        return amountToSwap;
    }

    function _getAmountAndPayFee(
        address _token,
        uint256 _amount,
        uint256 _minAmount,
        FeeObj calldata _feeObj
    ) internal returns (uint256) {
        (uint256 amountToSwap, uint256 wrapperFee, uint256 callerFee) = _getAmountAndFees(
            _token,
            _amount,
            _feeObj.callerBps
        );
        require(amountToSwap >= _minAmount && amountToSwap > 0, "OFTWrapper: not enough amountToSwap");

        if (wrapperFee > 0) IOFTV1(_token).safeTransferFrom(msg.sender, address(this), wrapperFee); // pay wrapper
        if (callerFee > 0) IOFTV1(_token).safeTransferFrom(msg.sender, _feeObj.caller, callerFee); // pay caller

        emit WrapperFees(_feeObj.partnerId, _token, wrapperFee, callerFee);

        return amountToSwap;
    }

    function _getAmountAndPayFeeNative(
        address _nativeOft,
        uint256 _amount,
        uint256 _minAmount,
        FeeObj calldata _feeObj
    ) internal returns (uint256) {
        (uint256 amountToSwap, uint256 wrapperFee, uint256 callerFee) = _getAmountAndFees(
            _nativeOft,
            _amount,
            _feeObj.callerBps
        );
        require(amountToSwap >= _minAmount && amountToSwap > 0, "OFTWrapper: not enough amountToSwap");

        // This function is always called after a call to deposit(amount).
        // `amount` tokens have been deposited into the wrapper, but only `amountToSwap` will be moved out,
        // this pays the wrapper and caller fee to this contract. Then, the wrapper pays the caller (next line).
        // Finally, the remaining message value (msg.value - amount) is forwarded to the sendFrom call to pay
        // for the bridge fee. Any remainder value gets refunded to the refund address.
        if (callerFee > 0) IOFTV1(_nativeOft).safeTransfer(_feeObj.caller, callerFee); // pay caller

        emit WrapperFees(_feeObj.partnerId, _nativeOft, wrapperFee, callerFee);

        return amountToSwap;
    }
}

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20, SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IOFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import { IOFTWithFee } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/IOFTWithFee.sol";
import { IOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { IOFTWrapper } from "./interfaces/IOFTWrapper.sol";
import { INativeOFT } from "./interfaces/INativeOFT.sol";
import { IOFT as IOFTEpv2, MessagingFee as MessagingFeeEpv2, SendParam as SendParamEpv2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

contract OFTWrapper is IOFTWrapper, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for IOFT;

    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_UINT = 2 ** 256 - 1; // indicates a bp fee of 0 that overrides the default bps

    uint256 public defaultBps;
    mapping(address => uint256) public oftBps;
    uint256 public callerBpsCap;

    constructor(uint256 _defaultBps, uint256 _callerBpsCap) {
        require(_defaultBps < BPS_DENOMINATOR, "OFTWrapper: defaultBps >= 100%");
        defaultBps = _defaultBps;
        callerBpsCap = _callerBpsCap;
    }

    function setDefaultBps(uint256 _defaultBps) external onlyOwner {
        require(_defaultBps < BPS_DENOMINATOR, "OFTWrapper: defaultBps >= 100%");
        defaultBps = _defaultBps;
        emit DefaultBpsSet(_defaultBps);
    }

    function setOFTBps(address _token, uint256 _bps) external onlyOwner {
        require(_bps < BPS_DENOMINATOR || _bps == MAX_UINT, "OFTWrapper: oftBps[_oft] >= 100%");
        oftBps[_token] = _bps;
        emit OFTBpsSet(_token, _bps);
    }

    function setCallerBpsCap(uint256 _callerBpsCap) external onlyOwner {
        require(_callerBpsCap <= BPS_DENOMINATOR, "OFTWrapper: callerBpsCap > 100%");
        callerBpsCap = _callerBpsCap;
        emit CallerBpsCapSet(_callerBpsCap);
    }

    function withdrawFees(address _oft, address _to, uint256 _amount) external onlyOwner {
        IOFT(_oft).safeTransfer(_to, _amount);
        emit WrapperFeeWithdrawn(_oft, _to, _amount);
    }

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
        _assertCallerBps(_feeObj.callerBps);
        uint256 amountToSwap = _getAmountAndPayFee(_oft, _amount, _minAmount, _feeObj);
        IOFT(_oft).sendFrom{ value: msg.value }(
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
        _assertCallerBps(_feeObj.callerBps);
        address token = IOFTV2(_proxyOft).token();
        {
            uint256 amountToSwap = _getAmountAndPayFeeProxy(token, _amount, _minAmount, _feeObj);

            // approve proxy to spend tokens
            IOFT(token).safeApprove(_proxyOft, amountToSwap);
            IOFT(_proxyOft).sendFrom{ value: msg.value }(
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
        if (IOFT(token).allowance(address(this), _proxyOft) > 0) IOFT(token).safeApprove(_proxyOft, 0);
    }

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
    ) external payable nonReentrant {
        _assertCallerBps(_feeObj.callerBps);
        require(msg.value >= _amount, "OFTWrapper: not enough value sent");

        INativeOFT(_nativeOft).deposit{ value: _amount }();
        uint256 amountToSwap = _getAmountAndPayFeeNative(_nativeOft, _amount, _minAmount, _feeObj);
        IOFT(_nativeOft).sendFrom{ value: msg.value - _amount }(
            address(this),
            _dstChainId,
            _toAddress,
            amountToSwap,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams
        );
    }

    function sendOFTV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        _assertCallerBps(_feeObj.callerBps);
        uint256 amountToSwap = _getAmountAndPayFee(_oft, _amount, _minAmount, _feeObj);
        IOFTV2(_oft).sendFrom{ value: msg.value }(msg.sender, _dstChainId, _toAddress, amountToSwap, _callParams);
    }

    function sendOFTFeeV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        _assertCallerBps(_feeObj.callerBps);
        uint256 amountToSwap = _getAmountAndPayFee(_oft, _amount, _minAmount, _feeObj);
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
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        _assertCallerBps(_feeObj.callerBps);
        address token = IOFTV2(_proxyOft).token();
        uint256 amountToSwap = _getAmountAndPayFeeProxy(token, _amount, _minAmount, _feeObj);

        // approve proxy to spend tokens
        IOFT(token).safeApprove(_proxyOft, amountToSwap);
        IOFTV2(_proxyOft).sendFrom{ value: msg.value }(
            address(this),
            _dstChainId,
            _toAddress,
            amountToSwap,
            _callParams
        );

        // reset allowance if sendFrom() does not consume full amount
        if (IOFT(token).allowance(address(this), _proxyOft) > 0) IOFT(token).safeApprove(_proxyOft, 0);
    }

    function sendProxyOFTFeeV2(
        address _proxyOft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        _assertCallerBps(_feeObj.callerBps);
        address token = IOFTV2(_proxyOft).token();
        uint256 amountToSwap = _getAmountAndPayFeeProxy(token, _amount, _minAmount, _feeObj);

        // approve proxy to spend tokens
        IOFT(token).safeApprove(_proxyOft, amountToSwap);
        IOFTWithFee(_proxyOft).sendFrom{ value: msg.value }(
            address(this),
            _dstChainId,
            _toAddress,
            amountToSwap,
            _minAmount,
            _callParams
        );

        // reset allowance if sendFrom() does not consume full amount
        if (IOFT(token).allowance(address(this), _proxyOft) > 0) IOFT(token).safeApprove(_proxyOft, 0);
    }

    function sendNativeOFTFeeV2(
        address _nativeOft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        uint256 _minAmount,
        IOFTV2.LzCallParams calldata _callParams,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        _assertCallerBps(_feeObj.callerBps);
        require(msg.value >= _amount, "OFTWrapper: not enough value sent");

        INativeOFT(_nativeOft).deposit{ value: _amount }();
        uint256 amountToSwap = _getAmountAndPayFeeNative(_nativeOft, _amount, _minAmount, _feeObj);
        IOFTWithFee(_nativeOft).sendFrom{ value: msg.value - _amount }(
            address(this),
            _dstChainId,
            _toAddress,
            amountToSwap,
            _minAmount,
            _callParams
        );
    }

    function sendOFTEpv2(
        address _oft,
        SendParamEpv2 calldata _sendParam,
        MessagingFeeEpv2 calldata _fee,
        address _refundAddress,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        _assertCallerBps(_feeObj.callerBps);
        uint256 amountToSwap = _getAmountAndPayFeeProxy(_oft, _sendParam.amountLD, _sendParam.minAmountLD, _feeObj);
        IOFTEpv2(_oft).send{ value: msg.value }(
            SendParamEpv2(
                _sendParam.dstEid,
                _sendParam.to,
                amountToSwap,
                _sendParam.minAmountLD,
                _sendParam.extraOptions,
                _sendParam.composeMsg,
                _sendParam.oftCmd
            ),
            _fee,
            _refundAddress
        );
    }

    function sendOFTAdapterEpv2(
        address _adapterOFT,
        SendParamEpv2 calldata _sendParam,
        MessagingFeeEpv2 calldata _fee,
        address _refundAddress,
        FeeObj calldata _feeObj
    ) external payable nonReentrant {
        _assertCallerBps(_feeObj.callerBps);
        address token = IOFT(_adapterOFT).token();
        uint256 amountToSwap = _getAmountAndPayFeeProxy(token, _sendParam.amountLD, _sendParam.minAmountLD, _feeObj);
        IERC20(token).safeApprove(_adapterOFT, amountToSwap);
        IOFTEpv2(_adapterOFT).send{ value: msg.value }(
            SendParamEpv2(
                _sendParam.dstEid,
                _sendParam.to,
                amountToSwap,
                _sendParam.minAmountLD,
                _sendParam.extraOptions,
                _sendParam.composeMsg,
                _sendParam.oftCmd
            ),
            _fee,
            _refundAddress
        );

        if (IERC20(token).allowance(address(this), _adapterOFT) > 0) IERC20(token).safeApprove(_adapterOFT, 0);
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

        IOFT(_token).safeTransferFrom(msg.sender, address(this), amountToSwap + wrapperFee); // pay wrapper and move proxy tokens to contract
        if (callerFee > 0) IOFT(_token).safeTransferFrom(msg.sender, _feeObj.caller, callerFee); // pay caller

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

        if (wrapperFee > 0) IOFT(_token).safeTransferFrom(msg.sender, address(this), wrapperFee); // pay wrapper
        if (callerFee > 0) IOFT(_token).safeTransferFrom(msg.sender, _feeObj.caller, callerFee); // pay caller

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

        // pay fee in NativeOFT token as the caller might not be able to receive ETH
        // wrapper fee is already in the contract after calling NativeOFT.deposit()
        if (callerFee > 0) IOFT(_nativeOft).safeTransfer(_feeObj.caller, callerFee); // pay caller

        emit WrapperFees(_feeObj.partnerId, _nativeOft, wrapperFee, callerFee);

        return amountToSwap;
    }

    function getAmountAndFees(
        address _token, // will be the token on proxies, and the oft on non-proxy
        uint256 _amount,
        uint256 _callerBps
    ) public view override returns (uint256 amount, uint256 wrapperFee, uint256 callerFee) {
        _assertCallerBps(_callerBps);
        return _getAmountAndFees(_token, _amount, _callerBps);
    }

    function _getAmountAndFees(
        address _token, // will be the token on proxies, and the oft on non-proxy
        uint256 _amount,
        uint256 _callerBps
    ) internal view returns (uint256 amount, uint256 wrapperFee, uint256 callerFee) {
        uint256 wrapperBps;

        uint256 tokenBps = oftBps[_token];
        if (tokenBps == MAX_UINT) {
            wrapperBps = 0;
        } else if (tokenBps > 0) {
            wrapperBps = tokenBps;
        } else {
            wrapperBps = defaultBps;
        }

        require(wrapperBps + _callerBps < BPS_DENOMINATOR, "OFTWrapper: Fee bps >= 100%");

        wrapperFee = wrapperBps > 0 ? (_amount * wrapperBps) / BPS_DENOMINATOR : 0;
        callerFee = _callerBps > 0 ? (_amount * _callerBps) / BPS_DENOMINATOR : 0;
        amount = wrapperFee > 0 || callerFee > 0 ? _amount - wrapperFee - callerFee : _amount;
    }

    function estimateSendFee(
        address _oft,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        bool _useZro,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external view override returns (uint nativeFee, uint zroFee) {
        _assertCallerBps(_feeObj.callerBps);
        (uint256 amount, , ) = _getAmountAndFees(IOFT(_oft).token(), _amount, _feeObj.callerBps);

        return IOFT(_oft).estimateSendFee(_dstChainId, _toAddress, amount, _useZro, _adapterParams);
    }

    function estimateSendFeeV2(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bool _useZro,
        bytes calldata _adapterParams,
        FeeObj calldata _feeObj
    ) external view override returns (uint nativeFee, uint zroFee) {
        _assertCallerBps(_feeObj.callerBps);
        (uint256 amount, , ) = _getAmountAndFees(IOFTV2(_oft).token(), _amount, _feeObj.callerBps);

        return IOFTV2(_oft).estimateSendFee(_dstChainId, _toAddress, amount, _useZro, _adapterParams);
    }

    function estimateSendFeeEpv2(
        address _oft,
        SendParamEpv2 calldata _sendParam,
        bool _payInLzToken,
        FeeObj calldata _feeObj
    ) external view returns (MessagingFeeEpv2 memory) {
        _assertCallerBps(_feeObj.callerBps);
        (uint256 amount, , ) = _getAmountAndFees(IOFTEpv2(_oft).token(), _sendParam.amountLD, _feeObj.callerBps);
        return
            IOFTEpv2(_oft).quoteSend(
                SendParamEpv2(
                    _sendParam.dstEid,
                    _sendParam.to,
                    amount,
                    _sendParam.minAmountLD,
                    _sendParam.extraOptions,
                    _sendParam.composeMsg,
                    _sendParam.oftCmd
                ),
                _payInLzToken
            );
    }

    function _assertCallerBps(uint256 _callerBps) internal view {
        require(_callerBps <= callerBpsCap, "OFTWrapper: callerBps > callerBpsCap");
    }
}

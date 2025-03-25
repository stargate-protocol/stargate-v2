// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20, SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IOFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import { OFTCore } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/OFTCore.sol";
import { OFTCoreV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTCoreV2.sol";
import { IOFTWithFee } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/IOFTWithFee.sol";
import { Fee } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/Fee.sol";
import { IOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { ILayerZeroEndpoint } from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import { IOFTWrapper } from "./interfaces/IOFTWrapper.sol";
import { INativeOFT } from "./interfaces/INativeOFT.sol";
import { IOFT as IOFTEpv2, MessagingFee as MessagingFeeEpv2, SendParam as SendParamEpv2, OFTLimit, OFTFeeDetail, OFTReceipt, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { IOAppCore } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppCore.sol";
import { IMessageLib } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLib.sol";
import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";

contract OFTWrapper is IOFTWrapper, Ownable, ReentrancyGuard {
    using OptionsBuilder for bytes;
    using SafeERC20 for IERC20;
    using SafeERC20 for IOFT;

    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_UINT = 2 ** 256 - 1; // indicates a bp fee of 0 that overrides the default bps
    uint256 public constant QUOTE_SRC_AMOUNT_MIN = 0;
    string public constant NATIVE_FEE_NAME = "nativeFee";
    string public constant WRAPPER_FEE_NAME = "wrapperFee";
    string public constant CALLER_FEE_NAME = "callerFee";
    uint8 public constant CONFIG_TYPE_OUTBOUND_BLOCK_CONFIRMATIONS = 5;
    uint8 public constant CONFIG_TYPE_ULN_CONFIG = 2;

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

    function _removeDust(
        uint _amount,
        uint _localDecimals,
        uint _sharedDecimals
    ) internal view virtual returns (uint amountAfter, uint dust) {
        uint ld2sdRate = 10 ** (_localDecimals - _sharedDecimals);
        dust = _amount % ld2sdRate;

        amountAfter = (_amount / ld2sdRate) * ld2sdRate;
    }

    function quote(
        QuoteInput calldata _input,
        FeeObj calldata _feeObj
    ) external view returns (QuoteResult memory quoteResult) {
        _assertCallerBps(_feeObj.callerBps);

        (
            QuoteFee memory wrapperFee,
            QuoteFee memory callerFee,
            uint256 amountAfterWrapperFees
        ) = _calculateInitialFeesAndAmount(_input, _feeObj);
        uint256 wrapperAndCallersFees = uint256(wrapperFee.amount) + uint256(callerFee.amount);
        QuoteOFTInput memory quoteOFTInput = QuoteOFTInput({
            version: _input.version,
            token: _input.token,
            dstEid: _input.dstEid,
            amountLD: _input.amountLD,
            minAmountLD: _input.minAmountLD,
            toAddress: _input.toAddress,
            feeObj: _feeObj,
            quoteResult: quoteResult,
            amountAfterWrapperFees: amountAfterWrapperFees,
            wrapperAndCallersFees: wrapperAndCallersFees,
            wrapperFee: wrapperFee,
            callerFee: callerFee,
            extraOptions: _input.extraOptions
        });

        if (_input.version == OFTVersion.Epv1OFTv1) {
            quoteResult = _quoteEpv1OFTv1(quoteOFTInput);
        } else if (_input.version == OFTVersion.Epv1OFTv2) {
            quoteResult = _quoteEpv1OFTv2(quoteOFTInput);
        } else if (_input.version == OFTVersion.Epv1FeeOFTv2) {
            quoteResult = _quoteEpv1FeeOFTv2(quoteOFTInput);
        } else if (_input.version == OFTVersion.Epv2OFT) {
            quoteResult = _quoteEpv2OFT(quoteOFTInput);
        } else {
            revert("Unsupported OFT version");
        }

        return quoteResult;
    }

    function _quoteEpv1OFTv1(QuoteOFTInput memory _input) internal view returns (QuoteResult memory) {
        QuoteResult memory quoteResult = _input.quoteResult;
        quoteResult.fees = new QuoteFee[](3);
        quoteResult.fees[0] = _input.wrapperFee;
        quoteResult.fees[1] = _input.callerFee;

        quoteResult.amountReceivedLD = _input.amountAfterWrapperFees;
        quoteResult.srcAmountMin = QUOTE_SRC_AMOUNT_MIN;
        quoteResult.srcAmountMax = type(uint256).max;

        quoteResult.srcAmount = quoteResult.amountReceivedLD + _input.wrapperAndCallersFees;

        (uint256 nativeFee, ) = IOFT(_input.token).estimateSendFee(
            _input.dstEid,
            abi.encodePacked(_input.toAddress),
            quoteResult.amountReceivedLD,
            false,
            bytes("")
        );
        quoteResult.fees[2] = QuoteFee({ fee: NATIVE_FEE_NAME, amount: int256(nativeFee), token: _input.token });

        quoteResult.confirmations = _getConfirmationsEpv1(_input);

        return quoteResult;
    }

    function _quoteEpv1OFTv2(QuoteOFTInput memory _input) internal view returns (QuoteResult memory) {
        QuoteResult memory quoteResult = _input.quoteResult;
        quoteResult.fees = new QuoteFee[](3);
        quoteResult.fees[0] = _input.wrapperFee;
        quoteResult.fees[1] = _input.callerFee;

        uint8 decimals = IERC20Metadata(_input.token).decimals();
        uint256 sharedDecimals = OFTCoreV2(_input.token).sharedDecimals();

        (quoteResult.amountReceivedLD, ) = _removeDust(_input.amountAfterWrapperFees, decimals, sharedDecimals);

        quoteResult.srcAmountMin = QUOTE_SRC_AMOUNT_MIN;
        (quoteResult.srcAmountMax, ) = _removeDust(type(uint256).max, decimals, sharedDecimals);

        quoteResult.srcAmount = quoteResult.amountReceivedLD + _input.wrapperAndCallersFees;

        (uint256 nativeFee, ) = IOFTV2(_input.token).estimateSendFee(
            _input.dstEid,
            _input.toAddress,
            quoteResult.amountReceivedLD,
            false,
            bytes("")
        );
        quoteResult.fees[2] = QuoteFee({ fee: NATIVE_FEE_NAME, amount: int256(nativeFee), token: _input.token });

        quoteResult.confirmations = _getConfirmationsEpv1(_input);

        return quoteResult;
    }

    function _quoteEpv1FeeOFTv2(QuoteOFTInput memory _input) internal view returns (QuoteResult memory) {
        QuoteResult memory quoteResult = _input.quoteResult;
        quoteResult.fees = new QuoteFee[](4);
        quoteResult.fees[0] = _input.wrapperFee;
        quoteResult.fees[1] = _input.callerFee;

        uint256 oftFee = Fee(_input.token).quoteOFTFee(_input.dstEid, _input.amountAfterWrapperFees);
        quoteResult.fees[2] = QuoteFee({ fee: "oftFee", amount: int256(oftFee), token: _input.token });

        uint8 decimals = IERC20Metadata(_input.token).decimals();
        uint256 sharedDecimals = OFTCoreV2(_input.token).sharedDecimals();

        uint256 amountAfterWrapperAndOftFee = _input.amountAfterWrapperFees - oftFee;
        (quoteResult.amountReceivedLD, ) = _removeDust(amountAfterWrapperAndOftFee, decimals, sharedDecimals);

        quoteResult.srcAmountMin = QUOTE_SRC_AMOUNT_MIN;
        (quoteResult.srcAmountMax, ) = _removeDust(type(uint256).max, decimals, sharedDecimals);

        quoteResult.srcAmount = quoteResult.amountReceivedLD + _input.wrapperAndCallersFees + oftFee;

        (uint256 nativeFee, ) = IOFTWithFee(_input.token).estimateSendFee(
            _input.dstEid,
            _input.toAddress,
            quoteResult.amountReceivedLD,
            false,
            bytes("")
        );
        quoteResult.fees[3] = QuoteFee({ fee: NATIVE_FEE_NAME, amount: int256(nativeFee), token: _input.token });

        quoteResult.confirmations = _getConfirmationsEpv1(_input);

        return quoteResult;
    }

    function _quoteEpv2OFT(QuoteOFTInput memory _input) internal view returns (QuoteResult memory) {
        QuoteResult memory quoteResult = _input.quoteResult;

        quoteResult = _getOftLimitsAndReceiptsForEpv2(_input);
        int256 wrapperAndCallersFees = quoteResult.fees[0].amount + quoteResult.fees[1].amount;

        require(quoteResult.srcAmount >= uint256(wrapperAndCallersFees), "Insufficient srcAmount for fee deduction");
        uint256 amountAfterFees = quoteResult.srcAmount - uint256(wrapperAndCallersFees);

        MessagingFee memory messagingFee = IOFTEpv2(_input.token).quoteSend(
            SendParamEpv2({
                dstEid: _input.dstEid,
                to: _input.toAddress,
                amountLD: amountAfterFees,
                minAmountLD: _input.minAmountLD,
                extraOptions: _input.extraOptions,
                composeMsg: bytes(""),
                oftCmd: bytes("")
            }),
            false
        );
        quoteResult.fees[2] = QuoteFee({
            fee: NATIVE_FEE_NAME,
            amount: int256(messagingFee.nativeFee),
            token: _input.token
        });

        quoteResult.confirmations = _getConfirmationsEpv2(_input);

        return quoteResult;
    }

    function _getConfirmationsEpv2(QuoteOFTInput memory _input) internal view returns (uint64) {
        bytes memory rawConfig = IMessageLib(
            IOAppCore(_input.token).endpoint().getSendLibrary(_input.token, _input.dstEid)
        ).getConfig(_input.dstEid, _input.token, CONFIG_TYPE_ULN_CONFIG);

        UlnConfig memory ulnConfig = abi.decode(rawConfig, (UlnConfig));

        return ulnConfig.confirmations;
    }

    function _getOftLimitsAndReceiptsForEpv2(QuoteOFTInput memory _input) internal view returns (QuoteResult memory) {
        QuoteResult memory quoteResult = _input.quoteResult;
        (OFTLimit memory oftLimit, OFTFeeDetail[] memory oftFeeDetails, OFTReceipt memory oftReceipt) = IOFTEpv2(
            _input.token
        ).quoteOFT(
                SendParamEpv2({
                    dstEid: _input.dstEid,
                    to: _input.toAddress,
                    amountLD: _input.amountAfterWrapperFees,
                    minAmountLD: _input.minAmountLD,
                    extraOptions: bytes(""),
                    composeMsg: bytes(""),
                    oftCmd: bytes("")
                })
            );

        quoteResult.fees = new QuoteFee[](3 + oftFeeDetails.length);
        quoteResult.fees[0] = _input.wrapperFee;
        quoteResult.fees[1] = _input.callerFee;
        uint256 oftFeeDetailsFees = 0;
        for (uint256 i = 0; i < oftFeeDetails.length; i++) {
            quoteResult.fees[i + 3] = QuoteFee({
                fee: oftFeeDetails[i].description,
                amount: oftFeeDetails[i].feeAmountLD,
                token: _input.token
            });
        }

        if (_input.amountLD > oftLimit.maxAmountLD) {
            (_input.wrapperFee, _input.callerFee, _input.amountAfterWrapperFees) = _reCalculateInitialFeesAndAmount(
                _input
            );
            quoteResult.fees[0] = _input.wrapperFee;
            quoteResult.fees[1] = _input.callerFee;
        }

        quoteResult.srcAmountMax = oftLimit.maxAmountLD;
        quoteResult.srcAmountMin = oftLimit.minAmountLD;
        quoteResult.amountReceivedLD = oftReceipt.amountReceivedLD;
        // using oftReceipt.amountSentLD because it has dust removed
        quoteResult.srcAmount =
            oftReceipt.amountSentLD +
            uint256(quoteResult.fees[0].amount) +
            uint256(quoteResult.fees[1].amount);

        return quoteResult;
    }

    function _reCalculateInitialFeesAndAmount(
        QuoteOFTInput memory _input
    ) internal view virtual returns (QuoteFee memory wrapperFee, QuoteFee memory callerFee, uint256 amountAfterFees) {
        QuoteInput memory input = QuoteInput({
            version: _input.version,
            token: _input.token,
            dstEid: _input.dstEid,
            amountLD: _input.amountLD,
            minAmountLD: _input.minAmountLD,
            toAddress: _input.toAddress,
            extraOptions: _input.extraOptions
        });

        return _calculateInitialFeesAndAmount(input, _input.feeObj);
    }

    function _calculateInitialFeesAndAmount(
        QuoteInput memory _input,
        FeeObj memory _feeObj
    ) internal view returns (QuoteFee memory wrapperFee, QuoteFee memory callerFee, uint256 amountAfterFees) {
        (uint256 _amountAfterWrapperFees, uint256 wrapperFeeAmount, uint256 callerFeeAmount) = _getAmountAndFees(
            _input.token,
            _input.amountLD,
            _feeObj.callerBps
        );
        amountAfterFees = _amountAfterWrapperFees;

        wrapperFee = QuoteFee({ fee: WRAPPER_FEE_NAME, amount: int256(wrapperFeeAmount), token: _input.token });
        callerFee = QuoteFee({ fee: CALLER_FEE_NAME, amount: int256(callerFeeAmount), token: _input.token });

        return (wrapperFee, callerFee, amountAfterFees);
    }

    function _getConfirmationsEpv1(QuoteOFTInput memory _input) internal view returns (uint64) {
        ILayerZeroEndpoint lzEndpoint;

        if (_input.version == OFTVersion.Epv1OFTv1) {
            lzEndpoint = ILayerZeroEndpoint(OFTCore(_input.token).lzEndpoint());
        } else if (_input.version == OFTVersion.Epv1OFTv2 || _input.version == OFTVersion.Epv1FeeOFTv2) {
            lzEndpoint = ILayerZeroEndpoint(OFTCoreV2(_input.token).lzEndpoint());
        } else {
            revert("Unsupported OFT version");
        }

        uint16 version = lzEndpoint.getSendVersion(_input.token);
        bytes memory result = lzEndpoint.getConfig(
            version,
            _input.dstEid,
            _input.token,
            CONFIG_TYPE_OUTBOUND_BLOCK_CONFIRMATIONS
        );
        uint64 outboundBlockConfirmations = abi.decode(result, (uint64));

        return outboundBlockConfirmations;
    }
}

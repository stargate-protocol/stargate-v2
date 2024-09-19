// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20, SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IOFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import { OFTCoreV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTCoreV2.sol";
import { BaseOFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/BaseOFTV2.sol";
import { IOFTWithFee } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/IOFTWithFee.sol";
import { Fee } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/Fee.sol";
import { IOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
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

    function exposed_removeDust(
        uint _amount,
        uint _localDecimals,
        uint _sharedDecimals
    ) external view returns (uint amountAfter, uint dust) {
        return _removeDust(_amount, _localDecimals, _sharedDecimals);
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

        uint256 fees = 0;
        uint256 amountAfterWrapperFees = 0;
        quoteResult.fees = new QuoteFee[](3);

        (quoteResult.fees, amountAfterWrapperFees) = _calculateInitialFeesAndAmount(_input, _feeObj, quoteResult.fees);
        fees = quoteResult.fees[0].amount + quoteResult.fees[1].amount;

        if (_input.version == 1) {
            // uint256 oftFee = Fee(_input._token).quoteOFTFee(_input._dstEid, amountAfterWrapperFees);
            BaseOFTV2 oft = BaseOFTV2(_input._token);

            (uint256 nativeFee, uint256 zroFee) = oft.estimateSendFee(
                _input._dstEid,
                _input._toAddress,
                _input._amount,
                false,
                bytes("")
            );

            quoteResult.fees[0] = QuoteFee({ fee: "nativeFee", amount: nativeFee, token: _input._token });

            address tokenAddress = IOFT(_input._token).token();
            uint8 decimals = IERC20Metadata(tokenAddress).decimals();
            uint256 sharedDecimals = OFTCoreV2(_input._token).sharedDecimals();

            (uint256 dstAmount, ) = _removeDust(amountAfterWrapperFees, decimals, sharedDecimals);

            quoteResult.srcAmountMin = 0;
            quoteResult.srcAmountMax = uint256(type(uint64).max);

            quoteResult.srcAmount = dstAmount + fees;
            quoteResult.amountReceivedLD = dstAmount;
        } else if (_input.version == 2) {
            address oftAddress = _input._adapter == address(0) ? _input._token : _input._adapter;

            OFTQuoteResult memory oftQuoteResult = _getOftLimitsAndReceiptsForEpv2(
                _input,
                _feeObj,
                quoteResult,
                amountAfterWrapperFees,
                fees
            );
            quoteResult = oftQuoteResult.quoteResult;
            fees = oftQuoteResult.fees;
            amountAfterWrapperFees = oftQuoteResult.amountAfterWrapperFees;

            {
                bytes memory options = bytes("");
                if (_input._nativeDrop != 0) {
                    require(_input._nativeDrop <= type(uint128).max, "OFTWrapper: nativeDrop exceeds uint128 max");
                    options = OptionsBuilder.newOptions().addExecutorNativeDropOption(
                        uint128(_input._nativeDrop),
                        _input._toAddress
                    );
                }

                MessagingFee memory messagingFee = IOFTEpv2(_input._token).quoteSend(
                    SendParamEpv2({
                        dstEid: _input._dstEid,
                        to: _input._toAddress,
                        amountLD: quoteResult.srcAmount - fees,
                        minAmountLD: _input._minAmount,
                        extraOptions: options,
                        composeMsg: bytes(""),
                        oftCmd: bytes("")
                    }),
                    false
                );

                quoteResult.fees[2] = QuoteFee({
                    fee: "nativeFee",
                    amount: messagingFee.nativeFee,
                    token: _input._token
                });
            }

            {
                bytes memory rawConfig = IMessageLib(
                    IOAppCore(oftAddress).endpoint().getSendLibrary(oftAddress, _input._dstEid)
                ).getConfig(_input._dstEid, oftAddress, 2);
                UlnConfig memory ulnConfig = abi.decode(rawConfig, (UlnConfig));
                quoteResult.confirmations = ulnConfig.confirmations;
            }
        }
    }

    function _getOftLimitsAndReceiptsForEpv2(
        QuoteInput calldata _input,
        FeeObj calldata _feeObj,
        QuoteResult memory quoteResult,
        uint256 amountAfterWrapperFees,
        uint256 fees
    ) internal view returns (OFTQuoteResult memory) {
        (
            OFTLimit memory oftLimit, // {minAmountLD, maxAmountLD}
            // Ignore oftFeeDetails because those aren't implemented yet
            ,
            OFTReceipt memory oftReceipt // {amountSentLD, amountReceivedLD}
        ) = IOFTEpv2(_input._token).quoteOFT(
                SendParamEpv2({
                    dstEid: _input._dstEid,
                    to: _input._toAddress,
                    amountLD: amountAfterWrapperFees,
                    minAmountLD: _input._minAmount,
                    extraOptions: bytes(""),
                    composeMsg: bytes(""),
                    oftCmd: bytes("")
                })
            );

        if (oftLimit.minAmountLD < _input._amount) {
            (quoteResult.fees, amountAfterWrapperFees) = _calculateInitialFeesAndAmount(
                _input,
                _feeObj,
                quoteResult.fees
            );
            fees = quoteResult.fees[0].amount + quoteResult.fees[1].amount;
        }

        quoteResult.srcAmountMax = oftLimit.maxAmountLD;
        quoteResult.srcAmountMin = oftLimit.minAmountLD;
        quoteResult.amountReceivedLD = oftReceipt.amountReceivedLD;

        quoteResult.srcAmount = oftReceipt.amountSentLD + fees;
        return OFTQuoteResult({ quoteResult: quoteResult, amountAfterWrapperFees: amountAfterWrapperFees, fees: fees });
    }

    function _calculateInitialFeesAndAmount(
        QuoteInput calldata _input,
        FeeObj calldata _feeObj,
        QuoteFee[] memory fees
    ) internal view returns (QuoteFee[] memory, uint256 amountAfterFees) {
        (uint256 _amountAfterWrapperFees, uint256 wrapperFee, uint256 callerFee) = _getAmountAndFees(
            _input._token,
            _input._amount,
            _feeObj.callerBps
        );
        amountAfterFees = _amountAfterWrapperFees;

        fees[0] = QuoteFee({ fee: "wrapperFee", amount: wrapperFee, token: _input._token });
        fees[1] = QuoteFee({ fee: "callerFee", amount: callerFee, token: _input._token });

        return (fees, amountAfterFees);
    }
}

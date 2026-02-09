// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { EndpointV2Alt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2Alt.sol";
import { MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { Transfer } from "../libs/Transfer.sol";
import { CreditMessaging } from "./CreditMessaging.sol";

/// @notice CreditMessaging variant for EndpointV2Alt chains where the "native" messaging fee is an ERC20 token.
/// @dev Funds the endpoint with the ALT fee token and forces msg.value to be zero.
contract CreditMessagingAlt is CreditMessaging, Transfer {
    /// @notice ERC20 token used by EndpointV2Alt as the "native" fee token on this chain.
    address public immutable feeToken;

    error CreditMessaging_NotAnAltEndpoint();
    error CreditMessaging_OnlyAltToken();

    constructor(address _endpoint, address _owner) CreditMessaging(_endpoint, _owner) {
        feeToken = EndpointV2Alt(_endpoint).nativeToken();
        if (feeToken == address(0)) revert CreditMessaging_NotAnAltEndpoint();
    }

    /// @dev Override _lzSend to quote the messaging fee in the ALT fee token and fund the endpoint before calling super._lzSend.
    /// @dev On EndpointV2Alt chains, msg.value must be zero and the "native" messaging fee is paid in an ERC20 token, so the _fee
    ///      argument passed in (derived from msg.value) will always be { nativeFee: 0, lzTokenFee: 0 } and is therefore ignored;
    ///      instead, this function re-quotes the fee on-chain in the ALT fee token and transfers that token to the endpoint.
    function _lzSend(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        MessagingFee memory /*_fee*/,
        address _sender
    ) internal override returns (MessagingReceipt memory receipt) {
        _assertNoNativeValue();

        // quote fee in ALT token and fund the endpoint
        MessagingFee memory fee = _quote(_dstEid, _message, _options, false);
        // fund the endpoint with the ERC20 native fee
        if (fee.nativeFee > 0) safeTransferTokenFrom(feeToken, msg.sender, address(endpoint), fee.nativeFee);

        return super._lzSend(_dstEid, _message, _options, fee, _sender);
    }

    /// @dev Override native payment hook so endpoint.send is called with msg.value == 0.
    function _payNative(uint256 /*_nativeFee*/) internal pure override returns (uint256 nativeFee) {
        nativeFee = 0;
    }

    function _assertNoNativeValue() internal view {
        if (msg.value != 0) revert CreditMessaging_OnlyAltToken();
    }
}

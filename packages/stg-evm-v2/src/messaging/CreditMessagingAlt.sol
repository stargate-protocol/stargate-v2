// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { EndpointV2Alt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2Alt.sol";
import { MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { TargetCreditBatch } from "../interfaces/ICreditMessaging.sol";
import { ICreditMessagingHandler, Credit } from "../interfaces/ICreditMessagingHandler.sol";
import { CreditMsgCodec, CreditBatch } from "../libs/CreditMsgCodec.sol";
import { CreditMessaging } from "./CreditMessaging.sol";
import { Transfer } from "../libs/Transfer.sol";

/// @notice ALT variant for CreditMessaging where the "native" messaging fee is an ERC20 token.
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

    /// @notice Send credits using ALT endpoint fee token; no ETH accepted.
    /// @dev This version quotes on-chain to determine the exact fee in the ALT token.
    function sendCredits(
        uint32 _dstEid,
        TargetCreditBatch[] calldata _creditBatches
    ) external payable override onlyPlanner {
        _assertNoNativeValue();

        (bytes memory message, bytes memory options, bool hasBatches) = _buildMessageAndOptions(
            _dstEid,
            _creditBatches
        );
        if (hasBatches) {
            // Quote fee in ALT token and fund the endpoint
            MessagingFee memory fee = _quote(_dstEid, message, options, false);
            // fund the endpoint with the ERC20 native fee
            if (fee.nativeFee > 0) safeTransferTokenFrom(feeToken, msg.sender, address(endpoint), fee.nativeFee);

            _lzSend(_dstEid, message, options, fee, msg.sender);
        }
    }

    /// @notice Send credits using a precomputed ALT native fee to avoid on-chain quote gas.
    /// @dev Caller must supply the correct nativeFee (e.g., from an off-chain quote). No ETH accepted.
    function sendCreditsWithFee(
        uint32 _dstEid,
        TargetCreditBatch[] calldata _creditBatches,
        uint256 _nativeFee
    ) external payable onlyPlanner {
        _assertNoNativeValue();

        (bytes memory message, bytes memory options, bool hasBatches) = _buildMessageAndOptions(
            _dstEid,
            _creditBatches
        );
        if (hasBatches) {
            // fund the endpoint with the ERC20 native fee
            if (_nativeFee > 0) safeTransferTokenFrom(feeToken, msg.sender, address(endpoint), _nativeFee);
            _lzSend(_dstEid, message, options, MessagingFee(_nativeFee, 0), msg.sender);
        }
    }

    /// @dev Override native payment hook so endpoint.send is called with msg.value == 0.
    function _payNative(uint256 /*_nativeFee*/) internal view override returns (uint256 nativeFee) {
        _assertNoNativeValue();
        nativeFee = 0;
    }

    /// @dev Build the message/options and indicate whether there is any batch to send.
    function _buildMessageAndOptions(
        uint32 _dstEid,
        TargetCreditBatch[] calldata _creditBatches
    ) internal returns (bytes memory message, bytes memory options, bool hasBatches) {
        CreditBatch[] memory batches = new CreditBatch[](_creditBatches.length);
        uint256 index = 0;
        uint128 totalCreditNum = 0; // total number of credits in all batches

        for (uint256 i = 0; i < _creditBatches.length; ++i) {
            TargetCreditBatch calldata targetBatch = _creditBatches[i];
            Credit[] memory actualCredits = ICreditMessagingHandler(_safeGetStargateImpl(targetBatch.assetId))
                .sendCredits(_dstEid, targetBatch.credits);
            if (actualCredits.length > 0) {
                batches[index++] = CreditBatch(targetBatch.assetId, actualCredits);
                totalCreditNum += uint128(actualCredits.length); // safe cast
            }
        }

        if (index != 0) {
            // resize the array to the actual number of batches
            assembly {
                mstore(batches, index)
            }
            message = CreditMsgCodec.encode(batches, totalCreditNum);
            options = _buildOptions(_dstEid, totalCreditNum);
            hasBatches = true;
        }
    }

    function _assertNoNativeValue() internal view {
        if (msg.value != 0) revert CreditMessaging_OnlyAltToken();
    }
}

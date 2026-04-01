// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { CreditMessaging } from "./CreditMessaging.sol";
import { TargetCreditBatch } from "../interfaces/ICreditMessaging.sol";
import { CreditMsgCodec, CreditBatch } from "../libs/CreditMsgCodec.sol";
import { IMintBurnCreditMessaging } from "../interfaces/IMintBurnCreditMessaging.sol";
import { ICreditMessagingHandler, Credit } from "../interfaces/ICreditMessagingHandler.sol";

contract MintBurnCreditMessaging is CreditMessaging, IMintBurnCreditMessaging {
    error MintBurnCreditMessaging_EmptyReason();

    constructor(address _endpoint, address _owner) CreditMessaging(_endpoint, _owner) {}

    // ---------------------------------- Only Owner ------------------------------------------

    /// @dev Credits are sent to the destination chain without being deducted on the current chain.
    function mintCredits(
        uint32 _dstEid,
        CreditBatch[] calldata _batches,
        string calldata _reason
    ) external payable onlyOwner {
        if (bytes(_reason).length == 0) revert MintBurnCreditMessaging_EmptyReason();
        (bytes memory message, bytes memory options) = _buildMessagePayload(_dstEid, _batches);
        _lzSend(_dstEid, message, options, MessagingFee(msg.value, 0), msg.sender);
        emit CreditsMinted(_dstEid, _batches, _reason);
    }

    /// @dev Credits are deducted on the current chain without sending an LZ message to any other chain.
    function burnCredits(TargetCreditBatch[] calldata _creditBatches, string calldata _reason) external onlyOwner {
        if (bytes(_reason).length == 0) revert MintBurnCreditMessaging_EmptyReason();
        for (uint256 i = 0; i < _creditBatches.length; i++) {
            TargetCreditBatch calldata targetBatch = _creditBatches[i];
            Credit[] memory burned = ICreditMessagingHandler(_safeGetStargateImpl(targetBatch.assetId)).sendCredits(
                0,
                targetBatch.credits
            );
            emit CreditsBurned(targetBatch.assetId, burned, _reason);
        }
    }

    function quoteMintCredits(
        uint32 _dstEid,
        CreditBatch[] calldata _batches
    ) external view returns (MessagingFee memory fee) {
        (bytes memory message, bytes memory options) = _buildMessagePayload(_dstEid, _batches);
        fee = _quote(_dstEid, message, options, false);
    }

    /// @dev Helper that encodes the credit batches and builds the LZ options shared by mintCredits and quoteMintCredits.
    function _buildMessagePayload(
        uint32 _dstEid,
        CreditBatch[] memory _batches
    ) internal view returns (bytes memory message, bytes memory options) {
        uint128 totalCreditNum = 0;
        for (uint256 i = 0; i < _batches.length; i++) {
            totalCreditNum += uint128(_batches[i].credits.length);
        }
        message = CreditMsgCodec.encode(_batches, totalCreditNum);
        options = _buildOptions(_dstEid, totalCreditNum);
    }
}

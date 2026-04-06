// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { CreditMessaging } from "./CreditMessaging.sol";
import { TargetCreditBatch } from "../interfaces/ICreditMessaging.sol";
import { CreditBatch } from "../libs/CreditMsgCodec.sol";
import { ICreditMessagingRecovery } from "../interfaces/ICreditMessagingRecovery.sol";
import { ICreditMessagingHandler, Credit } from "../interfaces/ICreditMessagingHandler.sol";

contract CreditMessagingRecovery is CreditMessaging, ICreditMessagingRecovery {
    constructor(address _endpoint, address _owner) CreditMessaging(_endpoint, _owner) {}

    // ---------------------------------- Only Owner ------------------------------------------

    /// @dev Credits are applied directly on the current chain by calling receiveCredits locally,
    ///      without deducting credits from any source or sending an LZ message.
    function mintCredits(CreditBatch[] calldata _batches, string calldata _reason) external onlyOwner {
        if (bytes(_reason).length == 0) revert CreditMessagingRecovery_EmptyReason();
        for (uint256 i = 0; i < _batches.length; i++) {
            CreditBatch calldata batch = _batches[i];
            ICreditMessagingHandler(_safeGetStargateImpl(batch.assetId)).receiveCredits(0, batch.credits);
        }
        emit CreditsMinted(_batches, _reason);
    }

    /// @dev Credits are deducted on the current chain by calling sendCredits locally with minAmount = amount,
    ///      making it all-or-nothing. No LZ message is sent to any other chain.
    function burnCredits(TargetCreditBatch[] calldata _batches, string calldata _reason) external onlyOwner {
        if (bytes(_reason).length == 0) revert CreditMessagingRecovery_EmptyReason();
        CreditBatch[] memory burned = new CreditBatch[](_batches.length);
        for (uint256 i = 0; i < _batches.length; i++) {
            TargetCreditBatch calldata batch = _batches[i];
            burned[i] = CreditBatch(
                batch.assetId,
                ICreditMessagingHandler(_safeGetStargateImpl(batch.assetId)).sendCredits(0, batch.credits)
            );
        }
        emit CreditsBurned(burned, _reason);
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { TargetCreditBatch } from "./ICreditMessaging.sol";
import { CreditBatch } from "../libs/CreditMsgCodec.sol";
import { Credit } from "./ICreditMessagingHandler.sol";

/// @title CreditMessagingRecovery API
/// @dev Defines the emergency credit management functions available only to the contract owner.
///      These functions are intentionally separate from the standard ICreditMessaging interface
///      to make clear that they bypass normal credit validation and must be used with care.
interface ICreditMessagingRecovery {
    /// @notice Thrown when mintCredits or burnCredits is called with an empty reason string.
    error CreditMessagingRecovery_EmptyReason();

    /// @notice Emitted by mintCredits function with all batches that were applied.
    /// @param batches The list of credit batches that were minted.
    /// @param reason The reason for the minting.
    event CreditsMinted(CreditBatch[] batches, string reason);

    /// @notice Emitted by burnCredits function with the actual credits removed by the handler.
    /// @param batches The list of credit batches that were burned.
    /// @param reason The reason for the burning.
    event CreditsBurned(CreditBatch[] batches, string reason);

    /// @notice Mints credits on the current chain by calling receiveCredits locally.
    /// @param _batches The credit batches to mint. Set srcEid = localEid to restore local redemption credits.
    /// @param _reason Plain-text explanation emitted on-chain for auditability.
    function mintCredits(CreditBatch[] calldata _batches, string calldata _reason) external;

    /// @notice Burns credits on the current chain by calling sendCredits locally without sending an LZ message.
    /// @param _batches The credit batches to burn.
    /// @param _reason Plain-text explanation emitted on-chain for auditability.
    function burnCredits(TargetCreditBatch[] calldata _batches, string calldata _reason) external;
}

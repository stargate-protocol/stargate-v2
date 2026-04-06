// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { TargetCreditBatch } from "./ICreditMessaging.sol";
import { CreditBatch } from "../libs/CreditMsgCodec.sol";
import { Credit } from "./ICreditMessagingHandler.sol";

/// @title MintBurnCreditMessaging API
/// @dev Defines the emergency credit management functions available only to the contract owner.
///      These functions are intentionally separate from the standard ICreditMessaging interface
///      to make clear that they bypass normal credit validation and must be used with care.
interface IMintBurnCreditMessaging {
    /// @notice Thrown when mintCredits or burnCredits is called with an empty reason string.
    error MintBurnCreditMessaging_EmptyReason();

    /// @notice Emitted when credits are minted locally without a corresponding debit on a source chain.
    event CreditsMinted(uint16 assetId, Credit[] credits, string reason);

    /// @notice Emitted when credits are burned locally without sending an LZ message.
    event CreditsBurned(uint16 assetId, Credit[] credits, string reason);

    /// @notice Mints credits on the current chain by calling receiveCredits locally.
    /// @param _batches The credit batches to mint. Set srcEid = localEid to restore local redemption credits.
    /// @param _reason Plain-text explanation emitted on-chain for auditability.
    function mintCredits(CreditBatch[] calldata _batches, string calldata _reason) external;

    /// @notice Burns credits on the current chain by calling sendCredits locally without sending an LZ message.
    ///         Uses minAmount = amount making it all-or-nothing — reverts if the path has insufficient credits.
    /// @param _batches The credit batches to burn. minAmount must equal amount for each credit entry.
    /// @param _reason Plain-text explanation emitted on-chain for auditability.
    function burnCredits(TargetCreditBatch[] calldata _batches, string calldata _reason) external;
}

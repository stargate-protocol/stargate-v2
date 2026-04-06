// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { CreditBatch } from "../libs/CreditMsgCodec.sol";
import { TargetCreditBatch } from "./ICreditMessaging.sol";
import { Credit } from "./ICreditMessagingHandler.sol";

/// @title MintBurnCreditMessaging API
/// @dev Defines the emergency credit management functions available only to the contract owner.
///      These functions are intentionally separate from the standard ICreditMessaging interface
///      to make clear that they bypass normal credit validation and must be used with care.
interface IMintBurnCreditMessaging {
    /// @notice Thrown when mintCredits or burnCredits is called with an empty reason string.
    error MintBurnCreditMessaging_EmptyReason();

    /// @notice Emitted when credits are minted to a destination chain without local deduction.
    event CreditsMinted(uint32 dstEid, CreditBatch[] batches, string reason);

    /// @notice Emitted when credits are burned locally without sending an LZ message.
    event CreditsBurned(uint16 assetId, Credit[] credits, string reason);

    /// @notice Mints credits on a destination chain without consuming local credits.
    /// @param _dstEid The destination LayerZero endpoint ID.
    /// @param _batches The credit batches to mint. Set srcEid = dstEid to restore local redemption credits.
    /// @param _reason Plain-text explanation emitted on-chain for auditability.
    function mintCredits(uint32 _dstEid, CreditBatch[] calldata _batches, string calldata _reason) external payable;

    /// @notice Quotes the LZ messaging fee for a mintCredits call.
    /// @param _dstEid The destination LayerZero endpoint ID.
    /// @param _batches The credit batches to be minted.
    /// @return fee The native fee required.
    function quoteMintCredits(
        uint32 _dstEid,
        CreditBatch[] calldata _batches
    ) external view returns (MessagingFee memory fee);

    /// @notice Burns credits locally without sending an LZ message.
    /// @param _creditBatches The credit batches to burn.
    /// @param _reason Plain-text explanation emitted on-chain for auditability.
    function burnCredits(TargetCreditBatch[] calldata _creditBatches, string calldata _reason) external;
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { MessagingFee, StargatePool, Transfer } from "../../src/StargatePool.sol";
import { MessagingReceipt, Ticket } from "../../src/interfaces/IStargate.sol";
import { StargatePoolNative } from "../../src/StargatePoolNative.sol";
import { SendParam } from "../../src/StargatePool.sol";

/// @title A StargatePool which administers a pool of native coin and tracks planner fees.
/// @dev This contract is intended for testing purposes only.
/// @dev This contract differs from StargatePoolNative as the planner fee is tracked explicitly.  This contract is
/// @dev useful in contexts where gas efficiency is not a concern, but where proving solvency is important (i.e.,
/// @dev testing environments).
contract StargatePoolNativeWithTrackedPlannerFee is StargatePoolNative {
    /// @dev track the plannerFee explicitly
    uint256 internal pf;

    constructor(
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        uint8 _tokenDecimals,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargatePoolNative(_lpTokenName, _lpTokenSymbol, _tokenDecimals, _sharedDecimals, _endpoint, _owner) {}

    function _rideBus(
        SendParam calldata _sendParam,
        MessagingFee memory _messagingFee,
        uint64 _amountSD,
        address _refundAddress
    ) internal override returns (MessagingReceipt memory receipt, Ticket memory ticket) {
        (receipt, ticket) = super._rideBus(_sendParam, _messagingFee, _amountSD, _refundAddress);
        pf += receipt.fee.nativeFee;
    }

    function _plannerFee() internal view override returns (uint256) {
        return pf;
    }

    function withdrawPlannerFee() external override onlyCaller(planner) {
        uint256 fee = pf;
        pf = 0;
        Transfer.transferNative(msg.sender, fee, false);
        emit PlannerFeeWithdrawn(fee);
    }
}

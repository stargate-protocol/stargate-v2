// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { EndpointV2Alt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2Alt.sol";
import { MessagingReceipt, MessagingFee, SendParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { StargateOFT } from "./StargateOFT.sol";
import { ITokenMessaging, RideBusParams, TaxiParams, Ticket } from "./interfaces/ITokenMessaging.sol";
import { Transfer } from "./libs/Transfer.sol";

/// @notice OFT variant for EndpointV2Alt chains where the "native" messaging fee is an ERC20 token.
/// @dev Reuses all OFT logic; only fee assertion, collection/refund, planner fee accounting, and taxi funding are overridden.
contract StargateOFTAlt is StargateOFT {
    /// @notice ERC20 token used by EndpointV2Alt as the "native" fee token on this chain.
    address public immutable feeToken;

    error Stargate_NotAnAltEndpoint();
    error Stargate_OnlyAltToken();

    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFT(_token, _sharedDecimals, _endpoint, _owner) {
        feeToken = EndpointV2Alt(_endpoint).nativeToken();
        if (feeToken == address(0)) revert Stargate_NotAnAltEndpoint();
    }

    //  StargateBase Overrides

    // ---------------------------------- Only Planner ------------------------------------------
    /// @notice Withdraw planner fees accumulated in the fee token.
    function withdrawPlannerFee() external override onlyCaller(planner) {
        uint256 available = _plannerFee();
        Transfer.safeTransferToken(feeToken, msg.sender, available);
        emit PlannerFeeWithdrawn(available);
    }

    /// @dev Planner fee is held in the fee token balance of this contract for ALT.
    function _plannerFee() internal view override returns (uint256) {
        return IERC20(feeToken).balanceOf(address(this));
    }

    /// @dev Taxi path: pull fee token from user to TokenMessaging, then send (no ETH).
    function _taxi(
        SendParam calldata _sendParam,
        MessagingFee memory _messagingFee,
        uint64 _amountSD,
        address _refundAddress
    ) internal virtual override returns (MessagingReceipt memory receipt) {
        if (_messagingFee.lzTokenFee > 0) _payLzToken(_messagingFee.lzTokenFee); // handle lz token fee

        // Push native ERC20 fee to the endpoint
        if (_messagingFee.nativeFee > 0) {
            Transfer.safeTransferTokenFrom(feeToken, msg.sender, address(endpoint), _messagingFee.nativeFee);
        }

        receipt = ITokenMessaging(tokenMessaging).taxi(
            TaxiParams({
                sender: msg.sender,
                dstEid: _sendParam.dstEid,
                receiver: _sendParam.to,
                amountSD: _amountSD,
                composeMsg: _sendParam.composeMsg,
                extraOptions: _sendParam.extraOptions
            }),
            _messagingFee,
            _refundAddress
        );
    }

    /**
     * @dev Bus path (ALT): pull exactly the required ERC20 fare into this contract (no refund path).
     * Normal (ETH) behavior in StargateBase._rideBus:
     * - The rider passes a nativeFee (msg.value) up-front.
     * - After calling rideBus(), we know the exact bus fare (receipt.fee.nativeFee) based on current queue state.
     * - We compare provided vs fare; refund any excess in native coin; revert if short. The ETH that remains
     *   on the Stargate contract is planner treasury. The actual LayerZero send is later paid by the driver
     *   when driveBus() executes.
     *
     * ERC20-native:
     * - With ERC20s we are not forced to over-collect and refund; we can pull exactly what is needed AFTER
     *   rideBus() returns the final fare. We still use the user-specified providedFare as a hard cap
     *   guard (revert if fare > cap), preserving the same user safety guarantees as ETH.
     * - This avoids an extra token transfer (over-pull + refund).
     * - The collected ERC20 remains on this contract as planner treasury, mirroring the ETH semantics. The
     *   actual LayerZero send fee is paid by the bus driver at driveBus() time (driver → endpoint), same as ETH.
     */
    function _rideBus(
        SendParam calldata _sendParam,
        MessagingFee memory _messagingFee,
        uint64 _amountSD,
        address /*_refundAddress*/
    ) internal virtual override returns (MessagingReceipt memory receipt, Ticket memory ticket) {
        if (_messagingFee.lzTokenFee > 0) revert Stargate_LzTokenUnavailable();

        (receipt, ticket) = ITokenMessaging(tokenMessaging).rideBus(
            RideBusParams({
                sender: msg.sender,
                dstEid: _sendParam.dstEid,
                receiver: _sendParam.to,
                amountSD: _amountSD,
                nativeDrop: _sendParam.extraOptions.length > 0
            })
        );

        uint256 busFare = receipt.fee.nativeFee;
        uint256 providedFare = _messagingFee.nativeFee;

        // Cap check: fare cannot exceed the user's provided cap
        if (busFare > providedFare) revert Stargate_InsufficientFare();

        // Pull exactly the required fare; no refund path needed
        if (busFare > 0) {
            Transfer.safeTransferTokenFrom(feeToken, msg.sender, address(this), busFare);
        }
    }

    /// @dev In ALT, users must not send ETH for messaging fees.
    function _assertMessagingFee(
        MessagingFee memory _fee,
        uint256 /*_amountInLD*/
    ) internal view override returns (MessagingFee memory) {
        if (msg.value != 0) revert Stargate_OnlyAltToken();
        return _fee;
    }
}

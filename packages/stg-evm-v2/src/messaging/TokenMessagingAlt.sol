// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { EndpointV2Alt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2Alt.sol";
import { MessagingReceipt, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { TaxiParams } from "../interfaces/ITokenMessaging.sol";

import { TokenMessaging } from "./TokenMessaging.sol";
import { Bus, BusLib } from "../libs/Bus.sol";

/// @notice Alt-endpoint variant of TokenMessaging where the "native" fee is paid in an ERC20 fee token.
/// @dev Keeps message encoding, queueing and receive-path identical to TokenMessaging.
/// @dev Only fee settlement differs: taxi transfer feeToken to the endpoint instead of using msg.value.
/// @dev DriveBus is not allowed in ALT.
contract TokenMessagingAlt is TokenMessaging {
    /// @notice ERC20 token used by the EndpointV2Alt as the "native" fee token on this chain.
    address public immutable feeToken;

    error Stargate_NotAnAltEndpoint();
    error Stargate_BusNotAllowedInAlt();

    constructor(
        address _endpoint,
        address _owner,
        uint16 _queueCapacity
    ) TokenMessaging(_endpoint, _owner, _queueCapacity) {
        feeToken = EndpointV2Alt(_endpoint).nativeToken();
        if (feeToken == address(0)) revert Stargate_NotAnAltEndpoint();
    }

    // Note: We intentionally do NOT override `taxi(...)` here since in the ALT flow, StargateOFTAlt transfers
    //    the native ERC20 fee directly to the endpoint before invoking TokenMessaging.taxi(...).
    //    Thus, this contract does not need to move tokens for taxi sends.

    function driveBus(
        uint32 /*_dstEid*/,
        bytes calldata /*_passengers*/
    ) external payable override returns (MessagingReceipt memory receipt) {
        revert Stargate_BusNotAllowedInAlt();
    }

    /// @dev In ALT, no ETH is sent with the endpoint call; fees are settled in feeToken beforehand.
    function _payNative(uint256 /*_nativeFee*/) internal pure override returns (uint256 nativeFee) {
        return 0;
    }

    /* 
   /// @param _dstEid 
   /// @param _passengers  /// @dev In ALT, compute the fee and hand it to _lzSend without relying on msg.value.
    function driveBus(
        uint32 _dstEid,
        bytes calldata _passengers
    ) external payable override returns (MessagingReceipt memory receipt) {
        // Step 1: check the tickets and drive
        Bus memory bus = busQueues[_dstEid].checkTicketsAndDrive(queueCapacity, _passengers);

        // Step 2: generate the lzMsg and lzOptions
        (bytes memory message, bytes memory options) = _encodeMessageAndOptionsForDriveBus(_dstEid, bus);

        // Step 3: compute the fee, pay it in feeToken
        // ? how should this be done? quoting might be the trivial solution but is not good at all.
        MessagingFee memory fee;
        if (fee.nativeFee > 0) {
            // Driver pays at drive time: pull fee directly from driver to endpoint
            safeTransferTokenFrom(feeToken, msg.sender, address(endpoint), fee.nativeFee);
        }
        // Step 4: send the message through LZ (no msg.value)
        receipt = _lzSend(_dstEid, message, options, fee, msg.sender);

        // Step 5: emit the bus driven event with the guid
        emit BusLib.BusDriven(_dstEid, bus.startTicketId, bus.numPassengers, receipt.guid);
    }
    */
}

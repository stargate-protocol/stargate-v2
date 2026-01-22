// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { EndpointV2Alt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2Alt.sol";
import { MessagingReceipt, MessagingFee, SendParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { StargateOFT } from "./StargateOFT.sol";
import { ITokenMessaging, TaxiParams } from "./interfaces/ITokenMessaging.sol";
import { Transfer } from "./libs/Transfer.sol";

/// @notice OFT variant for EndpointV2Alt chains where the "native" messaging fee is an ERC20 token.
/// @dev Reuses all OFT logic; only fee assertion, collection/refund, planner fee accounting, and taxi funding are overridden.
/// @dev Messages in EndpointV2Alt chains can not be delivered in bus mode
contract StargateOFTAlt is StargateOFT {
    /// @notice ERC20 token used by EndpointV2Alt as the "native" fee token on this chain.
    address public immutable feeToken;

    error Stargate_NotAnAltEndpoint();
    error Stargate_OnlyAltToken();
    error Stargate_BusNotAllowedInAlt();

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

    /// @dev Push native fee ERC20 token to Endpoint, and avoid sending ETH to TokenMessaging.taxi.
    function _taxi(
        SendParam calldata _sendParam,
        MessagingFee memory _messagingFee,
        uint64 _amountSD,
        address _refundAddress
    ) internal virtual override returns (MessagingReceipt memory receipt) {
        // Push native ERC20 fee to the endpoint
        if (_messagingFee.nativeFee > 0) {
            Transfer.safeTransferTokenFrom(feeToken, msg.sender, address(endpoint), _messagingFee.nativeFee);
        }

        if (_messagingFee.lzTokenFee > 0) _payLzToken(_messagingFee.lzTokenFee); // handle lz token fee

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

    /// @dev In ALT, users must not send ETH for messaging fees.
    function _assertMessagingFee(
        MessagingFee memory _fee,
        uint256 /*_amountInLD*/
    ) internal view override returns (MessagingFee memory) {
        if (msg.value != 0) revert Stargate_OnlyAltToken();
        return _fee;
    }

    /// @dev Alt endpoints are taxi-only; reject bus mode at the mode check so all downstream bus flows revert early.
    /// @dev This makes quoteSend/quoteOFT fail for bus, prevents sendToken from reaching _rideBus.
    function _isTaxiMode(bytes calldata _oftCmd) internal pure override returns (bool) {
        if (_oftCmd.length != 0) revert Stargate_BusNotAllowedInAlt();
        return true;
    }
}

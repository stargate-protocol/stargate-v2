// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { TokenMessaging } from "./TokenMessaging.sol";

/// @notice TokenMessaging variant for EndpointV2Alt chains where the "native" messaging fee is an ERC20 token.
/// @dev Messages in EndpointV2Alt chains cannot be delivered in bus mode, however it is still possible to receive them.
contract TokenMessagingAlt is TokenMessaging {
    constructor(
        address _endpoint,
        address _owner,
        uint16 _queueCapacity
    ) TokenMessaging(_endpoint, _owner, _queueCapacity) {}

    /// @dev Alt endpoints accept ERC20 fees; block any native value from being forwarded.
    /// @dev we ignore msg.value not being zero intentionally, because in the StargateOFTAlt._taxi we are already sending no msg.value
    function _payNative(uint256 /*_nativeFee*/) internal pure override returns (uint256 nativeFee) {
        nativeFee = 0;
    }
}

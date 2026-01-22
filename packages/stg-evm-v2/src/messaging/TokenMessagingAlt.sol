// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { TokenMessaging } from "./TokenMessaging.sol";

contract TokenMessagingAlt is TokenMessaging {
    error TokenMessaging_OnlyAltToken();

    constructor(
        address _endpoint,
        address _owner,
        uint16 _queueCapacity
    ) TokenMessaging(_endpoint, _owner, _queueCapacity) {}

    /// @dev Alt endpoints accept ERC20 fees; block any native value from being forwarded.
    /// @dev we don't need to check msg.value is not zero because only taxi mode is allowed and in the StargateOFTAlt._taxi we are already sending no msg.value
    function _payNative(uint256 /*_nativeFee*/) internal pure override returns (uint256 nativeFee) {
        nativeFee = 0;
    }
}

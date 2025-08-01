// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { StargateOFTUSDC } from "../usdc/StargateOFTUSDC.sol";

/// @dev designed for bridged EURC migration per
/// @dev https://github.com/circlefin/stablecoin-evm/blob/master/doc/bridged_USDC_standard.md
contract StargateOFTEURC is StargateOFTUSDC {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFTUSDC(_token, _sharedDecimals, _endpoint, _owner) {}
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IBridgedEURCMinter } from "../interfaces/IBridgedEURCMinter.sol";
import { Transfer } from "../libs/Transfer.sol";
import { StargateOFT } from "../StargateOFT.sol";

/// @dev designed for bridged EURC migration per
/// @dev https://github.com/circlefin/stablecoin-evm/blob/master/doc/bridged_USDC_standard.md
contract StargateOFTEURC is StargateOFT {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFT(_token, _sharedDecimals, _endpoint, _owner) {}

    /// @dev Transfer EURC from the sender to this contract and burn it.
    function _inflow(address _from, uint256 _amountLD) internal virtual override returns (uint64 amountSD) {
        amountSD = _ld2sd(_amountLD);
        _amountLD = _sd2ld(amountSD); // remove dust
        Transfer.safeTransferTokenFrom(token, _from, address(this), _amountLD);
        IBridgedEURCMinter(token).burn(_amountLD);
    }

    function _outflow(address _to, uint256 _amountLD) internal virtual override returns (bool success) {
        try IBridgedEURCMinter(token).mint(_to, _amountLD) returns (bool s) {
            success = s;
        } catch {} // solhint-disable-line no-empty-blocks
    }
}

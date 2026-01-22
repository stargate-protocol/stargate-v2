// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { ITIP20Minter } from "../interfaces/ITIP20Minter.sol";
import { StargateOFTAlt } from "../StargateOFTAlt.sol";
import { Transfer } from "../libs/Transfer.sol";

/// @dev OFT variant for bridged stablecoin with TIP-20 and ALT endpoints.
/// - Transfers + Burns stablecoin on inflow and mints on outflow
contract StargateOFTTIP20 is StargateOFTAlt {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFTAlt(_token, _sharedDecimals, _endpoint, _owner) {}

    /// @dev Transfer stablecoin from the sender to this contract and burn it.
    function _inflow(address _from, uint256 _amountLD) internal virtual override returns (uint64 amountSD) {
        amountSD = _ld2sd(_amountLD);
        _amountLD = _sd2ld(amountSD); // remove dust
        Transfer.safeTransferTokenFrom(token, _from, address(this), _amountLD);
        ITIP20Minter(token).burn(_amountLD);
    }

    /// @dev Mint stablecoin to the receiver on outflow
    /// @dev TIP-20 mint function implementations do not return a boolean.
    function _outflow(address _to, uint256 _amountLD) internal virtual override returns (bool success) {
        try ITIP20Minter(token).mint(_to, _amountLD) {
            success = true;
        } catch {} // solhint-disable-line no-empty-blocks
    }
}

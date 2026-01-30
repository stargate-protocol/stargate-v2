// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { Transfer } from "../libs/Transfer.sol";
import { StargateOFTAlt } from "../StargateOFTAlt.sol";
import { ITIP20 } from "../interfaces/tip20/ITIP20.sol";
import { ITIP20RolesAuth } from "../interfaces/tip20/ITIP20RolesAuth.sol";

/// @notice StargateOFT variant for bridged stablecoin with TIP-20 and EndpointV2Alt.
/// @dev Messages in EndpointV2Alt chains can not be delivered in bus mode, however is still possible to receive them.
contract StargateOFTTIP20 is StargateOFTAlt {
    bytes32 internal constant DEFAULT_ADMIN_ROLE = 0;

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
        ITIP20(token).burn(_amountLD);
    }

    /// @dev Mint stablecoin to the receiver on outflow
    /// @dev TIP-20 mint function implementations do not return a boolean.
    function _outflow(address _to, uint256 _amountLD) internal virtual override returns (bool success) {
        try ITIP20(token).mint(_to, _amountLD) {
            success = true;
        } catch {} // solhint-disable-line no-empty-blocks
    }

    /// @notice Transfer the TIP-20 admin role to a new owner.
    /// @dev Grants DEFAULT_ADMIN_ROLE to `_newOwner` and renounces it for the current admin.
    /// @dev It mimics the transfer ownership functionality for the ERC20 tokens with roles.
    /// @param _newOwner The account to receive the admin role.
    function transferTokenOwnership(address _newOwner) external virtual override {
        // grant the role to the new owner and renounce it to remove it from current
        ITIP20RolesAuth(token).grantRole(DEFAULT_ADMIN_ROLE, _newOwner);
        ITIP20RolesAuth(token).renounceRole(DEFAULT_ADMIN_ROLE);
    }
}

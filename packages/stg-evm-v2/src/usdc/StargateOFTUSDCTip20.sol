// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { MessagingFee, MessagingReceipt, SendParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { IBridgedUSDCMinter } from "../interfaces/IBridgedUSDCMinter.sol";
import { ITokenMessaging, TaxiParams } from "../interfaces/ITokenMessaging.sol";
import { StargateOFTAlt } from "../StargateOFTAlt.sol";
import { Transfer } from "../libs/Transfer.sol";

/// @dev OFT variant for bridged USDC with TIP-20 and ALT endpoints.
/// - Transfers + Burns USDC on inflow and mints on outflow (same as StargateOFTUSDC).
contract StargateOFTUSDCTip20 is StargateOFTAlt {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateOFTAlt(_token, _sharedDecimals, _endpoint, _owner) {}

    /// @dev Transfer USDC from the sender to this contract and burn it.
    function _inflow(address _from, uint256 _amountLD) internal virtual override returns (uint64 amountSD) {
        amountSD = _ld2sd(_amountLD);
        _amountLD = _sd2ld(amountSD); // remove dust
        Transfer.safeTransferTokenFrom(token, _from, address(this), _amountLD);
        IBridgedUSDCMinter(token).burn(_amountLD);
    }

    /// @dev Mint USDC to the receiver on outflow (mirrors StargateOFTUSDC).
    function _outflow(address _to, uint256 _amountLD) internal virtual override returns (bool success) {
        try IBridgedUSDCMinter(token).mint(_to, _amountLD) returns (bool s) {
            success = s;
        } catch {} // solhint-disable-line no-empty-blocks
    }
}

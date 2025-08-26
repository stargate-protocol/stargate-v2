// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IBridgedEURCMinter } from "../interfaces/IBridgedEURCMinter.sol";
import { StargatePool } from "../StargatePool.sol";

/**
 * @title A StargatePool specialized for EURC which includes a function to burn credit to keep the total circulating
 *        amount constant.
 */
contract StargatePoolEURC is StargatePool {
    error StargatePoolEURC_BurnAmountExceedsBalance();

    address public burnAdmin;
    uint64 public burnAllowanceSD;

    constructor(
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        address _token,
        uint8 _tokenDecimals,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargatePool(_lpTokenName, _lpTokenSymbol, _token, _tokenDecimals, _sharedDecimals, _endpoint, _owner) {}

    /// @notice Allow a given address to burn up to a given amount of EURC.
    function allowBurn(address _burnAdmin, uint64 _burnAllowanceSD) external onlyOwner {
        burnAdmin = _burnAdmin;
        burnAllowanceSD = _burnAllowanceSD;
    }

    /**
     * @notice Burn EURC on the local chain.
     * @dev Used to burn locked EURC by a EURC admin during bridged EURC migration.
     * @dev https://github.com/circlefin/stablecoin-evm/blob/master/doc/bridged_USDC_standard.md
     * @dev The EURC contract owner has the power to blacklist this contract, so it is not adding any new exposure.
     */
    function burnLockedEURC() external {
        if (msg.sender != burnAdmin) revert Stargate_Unauthorized();
        if (burnAllowanceSD > poolBalanceSD) revert StargatePoolEURC_BurnAmountExceedsBalance();

        uint64 previousBurnAllowanceSD = burnAllowanceSD;

        poolBalanceSD -= burnAllowanceSD;
        burnAllowanceSD = 0;

        IBridgedEURCMinter(token).burn(_sd2ld(previousBurnAllowanceSD));
        paths[localEid].burnCredit(previousBurnAllowanceSD);
    }
}

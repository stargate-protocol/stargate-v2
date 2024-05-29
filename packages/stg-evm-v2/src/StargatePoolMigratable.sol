// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Minter } from "./interfaces/IERC20Minter.sol";
import { StargatePool } from "./StargatePool.sol";

/// @title StargatePoolMigratable
/// @notice A StargatePool that allows the owner to burn locked tokens during bridged token migration.
contract StargatePoolMigratable is StargatePool {
    error StargatePoolMigratable_BurnAmountExceedsBalance();

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

    /// @notice Allow a given address to burn up to a given allowance of tokens.
    function allowBurn(address _burnAdmin, uint64 _burnAllowanceSD) external onlyOwner {
        burnAdmin = _burnAdmin;
        burnAllowanceSD = _burnAllowanceSD;
    }

    /// @notice Burn locked tokens during bridged token migration.
    function burnLocked() external onlyCaller(burnAdmin) {
        if (burnAllowanceSD > poolBalanceSD) revert StargatePoolMigratable_BurnAmountExceedsBalance();

        uint64 previousBurnAllowanceSD = burnAllowanceSD;

        poolBalanceSD -= burnAllowanceSD;
        burnAllowanceSD = 0;

        uint256 burnAllowanceLD = _sd2ld(previousBurnAllowanceSD);

        IERC20(token).approve(address(this), burnAllowanceLD);
        IERC20Minter(token).burnFrom(address(this), burnAllowanceLD);
        paths[localEid].burnCredit(previousBurnAllowanceSD);
    }
}

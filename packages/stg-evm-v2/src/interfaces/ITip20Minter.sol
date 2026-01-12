// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

/// @title Interface for TIP-20 minter
/// @dev https://github.com/tempoxyz/tempo/blob/3dbee269cabffa58c6942ece1d155783924e8b5e/docs/specs/src/interfaces/ITIP20.sol
interface ITip20Minter {
    function mint(address to, uint256 amount) external;

    function burn(uint256 amount) external;
}

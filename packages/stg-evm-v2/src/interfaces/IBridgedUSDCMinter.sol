// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

/// @title Interface for Bridge USDC
/// @dev https://github.com/circlefin/stablecoin-evm/blob/master/contracts/v1/FiatTokenV1.sol
interface IBridgedUSDCMinter {
    function mint(address _to, uint256 _amount) external returns (bool);
    function burn(uint256 _amount) external;
}

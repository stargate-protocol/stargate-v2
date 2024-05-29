// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBridgedUSDCMinter } from "../interfaces/IBridgedUSDCMinter.sol";

/// @title USDC token mock.
/// @dev This is a mock and should not be used in production.
contract USDC is ERC20, Ownable, IBridgedUSDCMinter {
    // @dev This is a mock and is missing a lot of the actual USDC contract functionality
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    function mint(address _to, uint256 _qty) public override onlyOwner returns (bool) {
        _mint(_to, _qty);
        return true;
    }

    function burn(uint256 _amount) public override {
        _burn(_msgSender(), _amount);
    }
}

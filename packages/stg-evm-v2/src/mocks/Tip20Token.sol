// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TIP-20 token mock.
/// @dev This is a mock and should not be used in production.
contract TIP20Token is ERC20, Ownable {
    // @dev This is a mock and is missing a lot of the actual EURC/USDC contract functionality
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    event Minted(address _to, uint256 _qty);

    function mint(address _to, uint256 _qty) public onlyOwner {
        _mint(_to, _qty);
        emit Minted(_to, _qty);
    }

    function burn(uint256 _amount) public {
        _burn(_msgSender(), _amount);
    }
}

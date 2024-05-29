// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ERC20 token mock.
/// @dev A generic ERC20 token mock that can mint and burn tokens, used for testing only.
contract ERC20Token is ERC20 {
    uint8 internal _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _mint(msg.sender, 10000 ether);
        _decimals = decimals_;
    }

    function mint(address to, uint256 amount) public virtual {
        _mint(to, amount);
    }

    function burn(uint256 amount) public virtual {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public virtual {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        if (amount != 0 && allowance(msg.sender, spender) != 0) {
            return false;
        } else {
            return super.approve(spender, amount);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}

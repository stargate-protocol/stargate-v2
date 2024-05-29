// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Pool token mock.
/// @dev This is a mock and should not be used in production.
contract PoolToken is ERC20, Ownable {
    error PoolToken_MintCapExceeded();

    uint256 public immutable MINT_CAP_AMOUNT;

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        MINT_CAP_AMOUNT = 1000 * 10 ** decimals();
        _mint(msg.sender, 100_000_000_000 * 10 ** decimals());
    }

    // remember this is a MOCK token - public mint is useful!
    function mint(address _to, uint256 _qty) public {
        if (_qty > MINT_CAP_AMOUNT && msg.sender != owner()) {
            revert PoolToken_MintCapExceeded();
        }
        _mint(_to, _qty);
    }

    // burn tokens from the caller
    function burn(uint256 _amount) public virtual {
        _burn(_msgSender(), _amount);
    }

    // burn tokens from the account (caller must have allowance)
    function burnFrom(address _account, uint256 _amount) public virtual {
        _spendAllowance(_account, _msgSender(), _amount);
        _burn(_account, _amount);
    }
}

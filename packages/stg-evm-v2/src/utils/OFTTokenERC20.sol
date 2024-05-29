// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20Minter } from "../interfaces/IERC20Minter.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title A contract representing an ERC20 that can be minted and burned by a minter.
contract OFTTokenERC20 is Ownable, ERC20, IERC20Minter {
    mapping(address addr => bool canMint) public minters;
    uint8 internal _decimals;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    error OnlyMinter(address caller);

    modifier onlyMinter() {
        if (!minters[msg.sender]) revert OnlyMinter(msg.sender);
        _;
    }

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    /**
     * @dev Add a new minter.
     */
    function addMinter(address _minter) public onlyOwner {
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    /**
     * @dev Remove a minter.
     */
    function removeMinter(address _minter) public onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    /**
     * @dev See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must be the {Minter}.
     */
    function mint(address _account, uint256 _amount) public onlyMinter {
        _mint(_account, _amount);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, deducting from
     * the caller's allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for `_accounts`'s tokens of at least
     * `value`.
     * - the caller must be the {Minter}.
     */
    function burnFrom(address _account, uint256 _value) public onlyMinter {
        _spendAllowance(_account, msg.sender, _value);
        _burn(_account, _value);
    }

    /**
     * @dev See {ERC20-decimals}.
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}

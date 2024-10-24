/// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract TestTokenNoReturn is ERC20Upgradeable {

    function initialize() public initializer {
      __ERC20_init('Test Token No Return', 'NRT');
      _mint(msg.sender, 10**27); // 1 billion tokens, 18 decimal places
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /// @dev send `value` token to `to` from `msg.sender`
    /// @param recipient The address of the recipient
    /// @param amount The amount of token to be transferred
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);

        // HACK: This contract will not compile if we remove `returns (bool)`, so we manually return no data
        assembly {
            return(0, 0)
        }
    }

    /// @dev send `value` token to `to` from `from` on the condition it is approved by `from`
    /// @param sender The address of the sender
    /// @param recipient The address of the recipient
    /// @param amount The amount of token to be transferred
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        ERC20Upgradeable.transferFrom(sender, recipient, amount);

        // HACK: This contract will not compile if we remove `returns (bool)`, so we manually return no data
        assembly {
            return(0, 0)
        }
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { ERC20Permit, ERC20 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title A contract representing an ERC20Permit used for representing liquidity pool ownership.
contract LPToken is ERC20Permit {
    address public immutable stargate;
    uint8 internal immutable tokenDecimals;

    error LPToken_Unauthorized();

    modifier onlyStargate() {
        if (msg.sender != stargate) revert LPToken_Unauthorized();
        _;
    }

    /**
     * @notice Create a LP token to represent partial pool ownership.
     * @dev The sender of the message is set to the Stargate role. This is because it is expected that each
     *      StargatePool will create its own LPToken.
     * @param _name The name of the ERC20
     * @param _symbol The symbol for the ERC20
     * @param _decimals How many decimals does the ERC20 has
     */
    constructor(string memory _name, string memory _symbol, uint8 _decimals) ERC20(_name, _symbol) ERC20Permit(_name) {
        stargate = msg.sender;
        tokenDecimals = _decimals;
    }

    /// @notice Mint new LP tokens and transfer them to an account.
    /// @param _to The account to send the newly minted tokens to
    /// @param _amount How many tokens to mint
    function mint(address _to, uint256 _amount) external onlyStargate {
        _mint(_to, _amount);
    }

    /// @notice Burn tokens currently owned by an account.
    /// @param _from The account to burn the tokens from
    /// @param _amount How many tokens to burn
    function burnFrom(address _from, uint256 _amount) external onlyStargate {
        _burn(_from, _amount);
    }

    /// @notice How many decimals are used by this token.
    /// @return The amount of decimals
    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}

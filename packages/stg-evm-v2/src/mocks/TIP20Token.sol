// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ITIP20Minter } from "../interfaces/ITIP20Minter.sol";
import { ITIP20RolesAuth } from "../interfaces/ITIP20RolesAuth.sol";

/// @title TIP-20 token mock.
/// @dev This is a mock and should not be used in production.
contract TIP20Token is ERC20, ITIP20Minter, ITIP20RolesAuth {
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0;
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    event Minted(address _to, uint256 _qty);
    event RoleMembershipUpdated(bytes32 indexed role, address indexed account, address indexed sender, bool added);

    error TIP20Token_Unauthorized();
    error TIP20Token_InvalidRole();

    mapping(address => mapping(bytes32 => bool)) private hasRoleByAccount;

    // @dev This is a mock and is missing a lot of the actual EURC/USDC contract functionality
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        hasRoleByAccount[msg.sender][DEFAULT_ADMIN_ROLE] = true;
        hasRoleByAccount[msg.sender][ISSUER_ROLE] = true;
        emit RoleMembershipUpdated(DEFAULT_ADMIN_ROLE, msg.sender, msg.sender, true);
        emit RoleMembershipUpdated(ISSUER_ROLE, msg.sender, msg.sender, true);
    }

    function hasRole(bytes32 role, address account) external view returns (bool) {
        return hasRoleByAccount[account][role];
    }

    function grantRole(bytes32 role, address account) external override {
        if (!hasRoleByAccount[msg.sender][DEFAULT_ADMIN_ROLE]) revert TIP20Token_Unauthorized();
        if (role == DEFAULT_ADMIN_ROLE || role == ISSUER_ROLE) {
            hasRoleByAccount[account][role] = true;
            emit RoleMembershipUpdated(role, account, msg.sender, true);
            return;
        }
        revert TIP20Token_InvalidRole();
    }

    function renounceRole(bytes32 role) external override {
        if (role != DEFAULT_ADMIN_ROLE && role != ISSUER_ROLE) revert TIP20Token_InvalidRole();
        hasRoleByAccount[msg.sender][role] = false;
        emit RoleMembershipUpdated(role, msg.sender, msg.sender, false);
    }

    function mint(address _to, uint256 _qty) public override {
        if (!hasRoleByAccount[msg.sender][ISSUER_ROLE]) revert TIP20Token_Unauthorized();
        _mint(_to, _qty);
        emit Minted(_to, _qty);
    }

    function burn(uint256 _amount) public override {
        if (!hasRoleByAccount[msg.sender][ISSUER_ROLE]) revert TIP20Token_Unauthorized();
        _burn(_msgSender(), _amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

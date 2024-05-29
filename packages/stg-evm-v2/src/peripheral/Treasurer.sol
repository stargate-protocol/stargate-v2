// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { Transfer } from "../libs/Transfer.sol";
import { StargateBase } from "../StargateBase.sol";

/**
 * @title The treasurer is a role that administers the Stargate treasuries. Treasuries refer to the value that
 *        contracts hold and accrue as they collect fees from transactions and pay rewards.
 * @dev Only the Treasurer admin can add or withdraw from the Stargate treasuries. Only the Treasurer owner can
 *      withdraw from the Treasurer account. The main use-case for this role is to provide an initial treasury to
 *      pay rewards and to claim the unallocated rewards.
 */
contract Treasurer is Transfer {
    /// @dev admin only has the power to withdraw treasury fee to address(this) or recycle the balance into the treasury
    address public admin;
    mapping(address => bool) public stargates;

    error Unauthorized();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyStargate(address _stargate) {
        if (!stargates[_stargate]) revert Unauthorized();
        _;
    }

    /// @notice Create a new Treasurer
    /// @dev Ownership of the Treasurer is transferred to the Owner of the Stargate contract.
    constructor(address _owner, address _admin) {
        _transferOwnership(_owner);
        admin = _admin;
    }

    /// @notice Set the Admin role to an account.
    /// @dev Emits SetAdmin with the new Admin role
    /// @param _admin The address of the new Admin role
    function setAdmin(address _admin) external onlyOwner {
        admin = _admin;
    }

    /// @notice Set the Stargate contract to be managed by the Treasurer.
    function setStargate(address _stargate, bool _value) external onlyOwner {
        stargates[_stargate] = _value;
    }

    /// @notice Transfer tokens from the Treasurer account to another account
    /// @param _token The token to transfer
    /// @param _to The destination account
    /// @param _amount How many tokens to transfer
    function transfer(address _token, address _to, uint256 _amount) external onlyOwner {
        Transfer.safeTransfer(_token, _to, _amount, false); // no gas limit
    }

    /// @notice Transfer treasury fee from a Stargate contract into the Treasurer (this) contract.
    /// @param _amountSD The amount to withdraw, in SD
    function withdrawTreasuryFee(address _stargate, uint64 _amountSD) external onlyAdmin onlyStargate(_stargate) {
        StargateBase(_stargate).withdrawTreasuryFee(address(this), _amountSD);
    }

    /// @notice Return value to the Stargate contract.
    /// @dev can only withdraw from the balance of this contract
    /// @dev if the balance is not enough, just deposit directly to address(this)
    /// @param _amountLD How much value to add to the Stargate contract
    function addTreasuryFee(address _stargate, uint256 _amountLD) external onlyAdmin onlyStargate(_stargate) {
        StargateBase stargate = StargateBase(_stargate);
        address token = stargate.token();
        uint256 value;
        if (token != address(0)) {
            Transfer.forceApproveToken(token, _stargate, _amountLD);
        } else {
            value = _amountLD;
        }
        stargate.addTreasuryFee{ value: value }(_amountLD);
    }

    function recoverToken(
        address _stargate,
        address _token,
        uint256 _amount
    ) external onlyAdmin onlyStargate(_stargate) {
        StargateBase(_stargate).recoverToken(_token, address(this), _amount);
    }

    /// @notice Enable receiving native into the Treasurer
    receive() external payable {}
}

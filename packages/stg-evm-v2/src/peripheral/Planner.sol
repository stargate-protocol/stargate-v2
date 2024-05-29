// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { Transfer } from "../libs/Transfer.sol";

/// @title The Planner is responsible for the operational parameters of the bus. This includes adjusting
/// @title capacity, fare and driving the bus, as well as pausing Stargate Contracts.
contract Planner is Transfer {
    struct Call {
        address target; // the contract to call
        bytes data; // the data to call the contract with
        uint256 value; // the value to send with the call
        bool allowFailure; // whether to continue with the remaining calls in case of failure
    }

    struct Result {
        bool success; // whether the call was successful
        bytes returnData; // the data returned to the call
    }

    event Multicalled(Call[] calls, Result[] results);

    error CallFailed(uint256 index, bytes reason);

    /// @notice Make multiple calls using the Planner account.
    /// @dev The Planner role will be associated with this contract; this methods allows making calls as the Planner.
    /// @dev Reverts with CallFailed if a call fails and it has allowFailure = false.
    /// @dev Emits Multicalled with the Calls and Results
    /// @param _calls An array of Calls to execute
    /// @return results An array of Results corresponding to each Call made
    function multicall(Call[] calldata _calls) external payable onlyOwner returns (Result[] memory results) {
        results = new Result[](_calls.length);
        for (uint256 i = 0; i < _calls.length; i++) {
            Call calldata call = _calls[i];
            (bool success, bytes memory data) = call.target.call{ value: call.value }(call.data);
            if (call.allowFailure && !success) revert CallFailed(i, data);
            results[i] = Result(success, data);
        }
        emit Multicalled(_calls, results);
    }

    /// @notice Transfer a token from the Planner account to another account
    /// @param _token Address of the token to transfer
    /// @param _to Account to transfer the token to
    /// @param _amount How many tokens to transfer
    function withdrawFee(address _token, address _to, uint256 _amount) external onlyOwner {
        Transfer.transfer(_token, _to, _amount, false);
    }

    /// @notice Enable receive native on this account.
    receive() external payable {}
}

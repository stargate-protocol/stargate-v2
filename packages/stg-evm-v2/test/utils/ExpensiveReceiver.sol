// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/// @dev ExpensiveReceiver will spend a lot of gas when receiving native tokens. Used for testing.
contract ExpensiveReceiver {
    mapping(uint256 => uint256) store;

    fallback() external payable {
        for (uint256 i = 0; i < 10; i++) store[i] = i; // waste gas
    }
}

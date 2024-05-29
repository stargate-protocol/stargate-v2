// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

library AddressCast {
    function toBytes32(address _address) internal pure returns (bytes32 result) {
        result = bytes32(uint256(uint160(_address)));
    }

    function toAddress(bytes32 _addressBytes32) internal pure returns (address result) {
        result = address(uint160(uint256(_addressBytes32)));
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";

import { AddressCast } from "../../../src/libs/AddressCast.sol";

contract AddressCastTest is Test {
    using AddressCast for address;
    using AddressCast for bytes32;

    function test_toBytes32(address _addr) public {
        assertEq(_addr.toBytes32().toAddress(), _addr); // test identity
    }

    function test_toAddress(bytes32 _bytes32Addr) public {
        assertEq(
            _bytes32Addr.toAddress().toBytes32(),
            _bytes32Addr & bytes32(0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) // the last 20 bytes
        );
    }
}

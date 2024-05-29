// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

library OftCmdHelper {
    function taxi() internal pure returns (bytes memory) {
        return "";
    }

    function bus() internal pure returns (bytes memory) {
        return new bytes(1);
    }

    function drive(bytes memory _passengers) internal pure returns (bytes memory) {
        return _passengers;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RevertingInit {
    function init() external pure {
        revert();
    }
}

/// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "../Tether/TetherToken.sol";

contract ExampleUpgradedToken is TetherToken {

    function newFunctionNotPreviouslyDefined() public pure returns (bool) {
      return true;
    }
  }

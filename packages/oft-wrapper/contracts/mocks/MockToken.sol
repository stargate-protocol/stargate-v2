// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// this is a MOCK
contract MockToken is ERC20 {
    // this is a MOCK
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    // this is a MOCK
    function mint(address _to, uint _amount) public {
        _mint(_to, _amount);
    }
}

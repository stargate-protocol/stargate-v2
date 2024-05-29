// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZROMock is ERC20 {
    constructor() ERC20("ZRO Mock", "ZRO") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

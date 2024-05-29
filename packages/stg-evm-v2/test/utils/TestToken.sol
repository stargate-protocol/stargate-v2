// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    bool paused = false;

    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setPaused(bool _paused) external {
        paused = _paused;
    }

    function _beforeTokenTransfer(address /*from*/, address /*to*/, uint256 /*amount*/) internal view override {
        require(!paused, "paused");
    }
}

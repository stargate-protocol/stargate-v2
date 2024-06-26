// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/oft/OFT.sol";

// this is a MOCK
contract MockOFT is OFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint
    ) OFT(_name, _symbol, _lzEndpoint) {}

    // this is a MOCK
    function mint(address _to, uint _amount) public {
        _mint(_to, _amount);
    }
}

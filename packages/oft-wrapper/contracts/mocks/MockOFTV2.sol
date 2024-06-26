// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";

// this is a MOCK
contract MockOFTV2 is OFTV2 {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _sharedDecimals,
        address _lzEndpoint
    ) OFTV2(_name, _symbol, _sharedDecimals, _lzEndpoint) {}

    // this is a MOCK
    function mint(address _to, uint _amount) public {
        _mint(_to, _amount);
    }
}

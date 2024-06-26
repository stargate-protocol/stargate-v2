// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/oft/extension/ProxyOFT.sol";

// this is a MOCK
contract MockOFTProxy is ProxyOFT {
    constructor(
        address _token,
        address _lzEndpoint
    ) ProxyOFT(_token, _lzEndpoint) {}
}

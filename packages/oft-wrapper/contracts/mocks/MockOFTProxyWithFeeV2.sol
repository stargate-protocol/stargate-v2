// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/fee/ProxyOFTWithFee.sol";

// this is a MOCK
contract MockOFTProxyWithFeeV2 is ProxyOFTWithFee {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _lzEndpoint
    ) ProxyOFTWithFee(_token, _sharedDecimals, _lzEndpoint) {}
}

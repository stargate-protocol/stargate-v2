// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { ProxyOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/ProxyOFT.sol";

contract OFTProxyMock is ProxyOFT {
    constructor(address _lzEndpoint, address _token) ProxyOFT(_lzEndpoint, _token) {}

    function estimateSendFee(
        uint16 /*_dstChainId*/,
        bytes calldata /*_toAddress*/,
        uint _amount,
        bool /*_useZro*/,
        bytes calldata /*_adapterParams*/
    ) public pure override returns (uint nativeFee, uint zroFee) {
        nativeFee = _amount;
        zroFee = 0;
    }
}

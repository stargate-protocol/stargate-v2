// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { ProxyOFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/ProxyOFTV2.sol";

contract OFTProxyMock is ProxyOFTV2 {
    constructor(
        address _token,
        uint8 _sharedDecimals,
        address _lzEndpoint
    ) ProxyOFTV2(_token, _sharedDecimals, _lzEndpoint) {}

    function estimateSendFee(
        uint16 /*_dstChainId*/,
        bytes32 /*_toAddress*/,
        uint _amount,
        bool /*_useZro*/,
        bytes calldata /*_adapterParams*/
    ) public pure override returns (uint nativeFee, uint zroFee) {
        nativeFee = _amount;
        zroFee = 0;
    }
}

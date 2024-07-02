// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { OFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";

contract OFTMock is OFTV2 {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _sharedDecimals,
        address _lzEndpoint
    ) OFTV2(_name, _symbol, _sharedDecimals, _lzEndpoint) {}

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

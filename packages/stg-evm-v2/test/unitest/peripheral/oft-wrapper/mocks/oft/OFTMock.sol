// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { OFT as OFTv1 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/OFT.sol";
import { IOFTCore } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFTCore.sol";
import { OFTCore } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/OFTCore.sol";

contract OFTMock is OFTv1 {
    constructor(string memory _name, string memory _symbol, address _lzEndpoint) OFTv1(_name, _symbol, _lzEndpoint) {}

    function estimateSendFee(
        uint16 /*_dstChainId*/,
        bytes calldata /*_toAddress*/,
        uint _amount,
        bool /*_useZro*/,
        bytes calldata /*_adapterParams*/
    ) public pure override(OFTCore, IOFTCore) returns (uint nativeFee, uint zroFee) {
        nativeFee = _amount;
        zroFee = 0;
    }
}

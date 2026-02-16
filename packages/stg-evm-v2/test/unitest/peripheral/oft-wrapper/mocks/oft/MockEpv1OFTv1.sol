pragma solidity ^0.8.0;

import { OFT as OFTv1 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/OFT.sol";
import { IOFTCore } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFTCore.sol";
import { OFTCore } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/OFTCore.sol";

contract MockEpv1OFTv1 is OFTv1 {
    uint256 public constant FEE_DIVISOR = 1000;

    constructor(string memory _name, string memory _symbol, address _lzEndpoint) OFTv1(_name, _symbol, _lzEndpoint) {}

    function estimateSendFee(
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint _amount,
        bool _useZro,
        bytes calldata _adapterParams
    ) public view virtual override(OFTCore, IOFTCore) returns (uint nativeFee, uint zroFee) {
        return ((_amount / FEE_DIVISOR), 0);
    }
}

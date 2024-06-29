// SPDX-LICENSE-Identifier: UNLICENSED

pragma solidity ^0.8.22;

import { OFT as epv2_OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { OFTAdapter as epv2_OFTAdapter } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFTAdapter.sol";

contract MockOFT is epv2_OFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) epv2_OFT(_name, _symbol, _lzEndpoint, _delegate) {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}

contract MockOFTAdapter is epv2_OFTAdapter {
    constructor(
        address _token,
        address _lzEndpoint,
        address _delegate
    ) epv2_OFTAdapter(_token, _lzEndpoint, _delegate) {}
}

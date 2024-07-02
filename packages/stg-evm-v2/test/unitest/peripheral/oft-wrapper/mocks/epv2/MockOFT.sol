// SPDX-LICENSE-Identifier: UNLICENSED

pragma solidity ^0.8.22;

import { MessagingFee as MessagingFeeEpv2, SendParam as SendParamEpv2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OFT as OFTEpv2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { OFTAdapter as OFTAdapterEpv2 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFTAdapter.sol";

contract MockOFT is OFTEpv2 {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFTEpv2(_name, _symbol, _lzEndpoint, _delegate) {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}

contract CustomQuoteSendMockOFT is MockOFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) MockOFT(_name, _symbol, _lzEndpoint, _delegate) {}

    /// @dev A contrived quoteSend function that returns amount as the native fee.
    function quoteSend(
        SendParamEpv2 calldata _sendParam,
        bool /*_payInLzToken*/
    ) external pure override returns (MessagingFeeEpv2 memory msgFee) {
        return MessagingFeeEpv2(_sendParam.amountLD, 0);
    }
}

contract MockOFTAdapter is OFTAdapterEpv2 {
    constructor(
        address _token,
        address _lzEndpoint,
        address _delegate
    ) OFTAdapterEpv2(_token, _lzEndpoint, _delegate) {}
}

contract CustomQuoteSendMockOFTAdapter is MockOFTAdapter {
    constructor(
        address _token,
        address _lzEndpoint,
        address _delegate
    ) MockOFTAdapter(_token, _lzEndpoint, _delegate) {}

    /// @dev A contrived quoteSend function that returns amount as the native fee.
    function quoteSend(
        SendParamEpv2 calldata _sendParam,
        bool /*_payInLzToken*/
    ) external pure override returns (MessagingFeeEpv2 memory msgFee) {
        return MessagingFeeEpv2(_sendParam.amountLD, 0);
    }
}

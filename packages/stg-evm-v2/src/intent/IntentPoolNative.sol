// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IntentPool } from "./IntentPool.sol";

contract IntentPoolNative is IntentPool {
    IWETH public immutable weth;

    constructor(address _stargate, address _permit2, address _weth) IntentPool(_stargate, _permit2) {
        weth = IWETH(_weth);
    }

    function _send(
        IntentSend calldata _intentSend,
        bytes calldata _oftCmd,
        uint256 _intentFee,
        address _refundAddress
    ) internal override {
        weth.withdraw(_intentSend.amountLD); // unwrap weth before sending
        super._send(_intentSend, _oftCmd, _intentFee, _refundAddress);
    }

    function _getMsgValue(uint256 _nativeFee, uint256 _amountIn) internal pure override returns (uint256) {
        return _nativeFee + _amountIn;
    }

    /// @dev if token is ETH, return WETH
    function _intentSendToken() internal view override returns (address) {
        return address(weth);
    }

    /// @dev do nothing for native coin
    /// Function meant to be overridden
    // solhint-disable-next-line no-empty-blocks
    function _tokenApprove() internal override {}

    /// @dev Receive ETH from unwrapping WETH
    receive() external payable {}
}

interface IWETH {
    function withdraw(uint256 _amount) external;
}

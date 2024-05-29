// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { ILayerZeroComposer } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroComposer.sol";

contract ComposerMock is ILayerZeroComposer {
    event ComposeAck(address indexed _from, bytes32 indexed _guid, bytes _message, address _executor, bytes _extraData);

    uint256 public ackCount;

    function lzCompose(
        address _from,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable {
        ackCount++;

        emit ComposeAck(_from, _guid, _message, _executor, _extraData);
    }

    fallback() external payable {}
    receive() external payable {}
}

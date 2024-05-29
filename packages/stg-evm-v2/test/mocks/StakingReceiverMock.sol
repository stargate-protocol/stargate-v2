// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { IStakingReceiver, IERC20 } from "../../src/peripheral/rewarder/interfaces/IStakingReceiver.sol";

contract StakingReceiverMock is IStakingReceiver {
    bool public reverting;
    bytes4 public returnSelector = this.onWithdrawReceived.selector;

    function setRevert(bool _reverting) external {
        reverting = _reverting;
    }

    function setReturnSelector(bytes4 selector) external {
        returnSelector = selector;
    }

    function onWithdrawReceived(
        IERC20 token,
        address /*from*/,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        if (reverting) {
            revert("RewardReceiverMock: revert");
        }
        address to = abi.decode(data, (address));
        token.transfer(to, value);

        return returnSelector;
    }
}

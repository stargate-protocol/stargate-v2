// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { IStargateStaking, IERC20 } from "../../src/peripheral/rewarder/interfaces/IStargateStaking.sol";

contract DepositorMock {
    function depositTo(IStargateStaking staking, IERC20 token, address to, uint256 amount, uint256 approval) external {
        if (approval > 0) {
            token.approve(address(staking), approval);
        }
        staking.depositTo(token, to, amount);
    }
}

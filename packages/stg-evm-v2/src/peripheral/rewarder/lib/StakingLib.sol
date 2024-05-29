// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IStargateStaking, IERC20, IRewarder } from "../interfaces/IStargateStaking.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @dev Internal representation for a staking pool.
struct StakingPool {
    uint256 totalSupply;
    bool exists;
    IRewarder rewarder;
    mapping(address => uint256) balanceOf;
}

/// @dev Library for staking pool logic.
library StakingLib {
    using SafeERC20 for IERC20;

    /// @dev Emitted when `user` attempts to withdraw an amount which exceeds their balance.
    error WithdrawalAmountExceedsBalance();

    /**
     * @dev Deposit `amount` of `token` from `from` to `to`, increments the `to` balance and totalSupply while
     *      transferring in `token` from `from`, into the contract. Calls the `rewarder` to update the reward state.
     */
    function deposit(StakingPool storage self, IERC20 token, address from, address to, uint256 amount) internal {
        uint256 oldBal = self.balanceOf[to];
        uint256 oldSupply = self.totalSupply;

        uint256 newBal = oldBal + amount;

        self.balanceOf[to] = newBal;
        self.totalSupply = oldSupply + amount;

        emit IStargateStaking.Deposit(token, from, to, amount);

        self.rewarder.onUpdate(token, to, oldBal, oldSupply, newBal);
        token.safeTransferFrom(from, address(this), amount);
    }

    /**
     * @dev Withdraw `amount` of `token` from `from` to `to`, decrements the `from` balance and totalSupply while
     *      transferring out `token` to `to`. Calls the `rewarder` to update the reward state.
     */
    function withdraw(
        StakingPool storage self,
        IERC20 token,
        address from,
        address to,
        uint256 amount,
        bool withUpdate
    ) internal {
        uint256 oldBal = self.balanceOf[from];
        uint256 oldSupply = self.totalSupply;

        if (oldBal < amount) revert WithdrawalAmountExceedsBalance();

        uint256 newBal = oldBal - amount;

        self.balanceOf[from] = newBal;
        self.totalSupply = oldSupply - amount;

        emit IStargateStaking.Withdraw(token, from, to, amount, withUpdate);

        if (withUpdate) {
            self.rewarder.onUpdate(token, from, oldBal, oldSupply, newBal);
        }
        token.safeTransfer(to, amount);
    }

    /**
     *  @dev Claims the `user` rewards from the `rewarder`, and sends them to the `user`. This is done automatically on
     *       deposits and withdrawals as well.
     */
    function claim(StakingPool storage self, IERC20 token, address user) internal {
        self.rewarder.onUpdate(token, user, self.balanceOf[user], self.totalSupply, 0);
    }
}

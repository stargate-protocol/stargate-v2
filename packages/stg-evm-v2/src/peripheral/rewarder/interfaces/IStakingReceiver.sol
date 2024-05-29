// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStakingReceiver {
    function onWithdrawReceived(
        IERC20 token,
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);
}

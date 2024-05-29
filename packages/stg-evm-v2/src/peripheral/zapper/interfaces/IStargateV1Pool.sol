// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStargateV1Pool is IERC20 {
    function token() external view returns (IERC20);
    function poolId() external view returns (uint256);
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IStargateV1Pool } from "./IStargateV1Pool.sol";

interface IStargateV1Factory {
    function getPool(uint256 poolId) external view returns (IStargateV1Pool);
}

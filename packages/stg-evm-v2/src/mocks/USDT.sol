// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { OFTTokenERC20 } from "../utils/OFTTokenERC20.sol";

/// @title USDT token mock.
/// @dev This is a mock and should not be used in production.
contract USDT is OFTTokenERC20 {
    constructor() OFTTokenERC20("USDT", "USDT", 18) {}
}

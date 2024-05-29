// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

library TestConfig {
    // should be same as the depth in the foundry.toml
    // this make only print the summary when the depth is reached
    uint256 internal constant DEPTH = 5000;

    uint8 internal constant ASSET_NUM = 2;
    uint8 internal constant POOL_NUM = 1;
    uint8 internal constant NATIVE_POOL_NUM = 1;
    uint8 internal constant OFT_NUM = 1;
}

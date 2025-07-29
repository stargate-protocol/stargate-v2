// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { FiatTokenPoolMigrationTest } from "../FiatTokenPoolMigration.t.sol";

contract USDCPoolMigrationTest is FiatTokenPoolMigrationTest {
    function setUp() public override {
        isEURC = false;
        tokenName = "USDC";
        tokenSymbol = "USDC";

        poolName = "StargatePoolUSDC";
        poolSymbol = "USDCP";

        newPoolName = "USDCPool";
        newPoolSymbol = "USDCP";

        super.setUp();
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { FiatTokenPoolMigrationTest } from "../FiatTokenPoolMigration.t.sol";

contract EURCPoolMigrationTest is FiatTokenPoolMigrationTest {
    function setUp() public override {
        isEURC = true;
        tokenName = "EURC";
        tokenSymbol = "EURC";

        poolName = "StargatePoolEURC";
        poolSymbol = "EURCP";

        newPoolName = "EURCPool";
        newPoolSymbol = "EURCP";

        super.setUp();
    }
}

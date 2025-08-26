// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { FiatTokenRealMigrationTest } from "../FiatTokenRealMigration.t.sol";

contract EURCRealMigrationTest is FiatTokenRealMigrationTest {
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

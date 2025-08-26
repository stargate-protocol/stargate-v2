// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { FiatTokenRealMigrationTest } from "../FiatTokenRealMigration.t.sol";

contract USDCRealMigrationTest is FiatTokenRealMigrationTest {
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

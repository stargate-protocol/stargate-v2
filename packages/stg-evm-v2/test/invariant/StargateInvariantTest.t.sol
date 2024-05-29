// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.18;

import { Test } from "forge-std/Test.sol";

import { TestConfig } from "./TestConfig.sol";
import { BoundStargateHandler, UnboundStargateHandler } from "./handlers/StargateHandler.sol";

contract StargateInvariantTest is Test {
    BoundStargateHandler internal handler;

    function setUp() public {
        handler = new BoundStargateHandler(
            TestConfig.ASSET_NUM,
            TestConfig.POOL_NUM,
            TestConfig.NATIVE_POOL_NUM,
            TestConfig.OFT_NUM
        );

        // set target contract
        targetContract(address(handler));
        // set target selector
        bytes4[] memory selectors = new bytes4[](14);
        uint8 i = 0;
        selectors[i++] = BoundStargateHandler.deposit.selector;
        selectors[i++] = BoundStargateHandler.sendCredit.selector;
        selectors[i++] = BoundStargateHandler.taxi.selector;
        selectors[i++] = BoundStargateHandler.rideBus.selector;
        selectors[i++] = BoundStargateHandler.driveBus.selector;
        selectors[i++] = BoundStargateHandler.redeem.selector;
        selectors[i++] = BoundStargateHandler.redeemSend.selector;
        selectors[i++] = BoundStargateHandler.rebalance.selector;
        selectors[i++] = BoundStargateHandler.setFeeConfig.selector;
        selectors[i++] = BoundStargateHandler.withdrawTreasuryFee.selector;
        selectors[i++] = BoundStargateHandler.addTreasuryFee.selector;
        selectors[i++] = BoundStargateHandler.donate.selector;
        selectors[i++] = BoundStargateHandler.recover.selector;
        selectors[i++] = BoundStargateHandler.withdrawPlannerFee.selector;

        targetSelector(FuzzSelector(address(handler), selectors));
    }

    /// @dev Helper function to assert that the native balance matches expected for each non-native pool.
    function assert_expected_native_balance_for_non_native_pools(uint16 _assetId) internal {
        /// Iterate over non-native pools and ensure balance is equal to the accumulated planner fees.
        for (uint16 j = 0; j < TestConfig.POOL_NUM; j++) {
            uint16 poolEid = j + 1;
            assertEq(
                handler.getNativeBalance(poolEid, _assetId),
                handler.getPlannerFee(poolEid, _assetId),
                "assert_expected_native_balance_for_non_native_pools failed"
            );
        }
    }

    /// @dev Helper function to assert that the native balance matches expected for each native pool.
    function assert_expected_native_balance_for_native_pools(uint16 _assetId) internal {
        // Iterate over native pools and ensure that native balance is equal to the sum of:
        // 1. The pool balance
        // 2. The treasury fee
        // 3. The planner fee
        for (uint16 j = TestConfig.POOL_NUM; j < TestConfig.POOL_NUM + TestConfig.NATIVE_POOL_NUM; j++) {
            uint16 poolEid = j + 1;
            assertEq(
                handler.getNativeBalance(poolEid, _assetId),
                handler.getPoolBalance(poolEid, _assetId) +
                    handler.getTreasuryFee(poolEid, _assetId) +
                    handler.getPlannerFee(poolEid, _assetId),
                "assert_expected_native_balance_for_native_pools failed"
            );
        }
    }

    /// @dev Helper function to assert that the native balance matches expected for each OFT pool.
    function assert_expected_native_balance_for_oft_pools(uint16 _assetId) internal {
        // iterate over OFT pools and ensure native balance is equal to the accumulated planner fees.
        for (
            uint16 j = TestConfig.POOL_NUM + TestConfig.NATIVE_POOL_NUM;
            j < TestConfig.POOL_NUM + TestConfig.NATIVE_POOL_NUM + TestConfig.OFT_NUM;
            j++
        ) {
            uint16 poolEid = j + 1;
            assertEq(
                handler.getNativeBalance(poolEid, _assetId),
                handler.getPlannerFee(poolEid, _assetId),
                "assert_expected_native_balance_for_oft_pools failed"
            );
        }
    }

    // --- invariant tests ---
    function invariant_no_extra_native() internal {
        for (uint16 i = 0; i < TestConfig.ASSET_NUM; i++) {
            uint16 assetId = i + 1;
            assert_expected_native_balance_for_non_native_pools(assetId);
            assert_expected_native_balance_for_native_pools(assetId);
            assert_expected_native_balance_for_oft_pools(assetId);
        }
    }

    /// @dev (global): credits + pending bus to pool amount = pool balance
    function invariant_total_credit_equals_pool_balance() internal {
        for (uint16 i = 0; i < TestConfig.ASSET_NUM; i++) {
            uint16 assetId = i + 1;
            for (uint16 j = 0; j < TestConfig.POOL_NUM + TestConfig.NATIVE_POOL_NUM; j++) {
                uint16 poolEid = j + 1;
                uint256 totalCredit = handler.getTotalCredits(poolEid, assetId);
                uint256 poolBalance = handler.getPoolBalance(poolEid, assetId);
                uint256 totalBusAmount = handler.getTotalBusSendingAmount(poolEid, assetId);
                uint256 tvl = handler.getPoolTvl(poolEid, assetId);
                uint256 lpTokenSupply = handler.getPoolLpTokenSupply(poolEid, assetId);
                assertEq(tvl, lpTokenSupply, "tvl_equals_lp_token_supply failed");
                assertEq(totalCredit + totalBusAmount, poolBalance, "total_credit_equals_pool_balance failed");
            }
        }
    }

    function invariant_global_oft_supply_equals_global_surplus() internal {
        for (uint16 i = 0; i < TestConfig.ASSET_NUM; i++) {
            uint16 assetId = i + 1;
            uint256 globalOftSupply = handler.getGlobalOftSupply(assetId);
            uint256 globalTvl = handler.getGlobalTvl(assetId);
            uint256 globalBusAmount = handler.getGlobalBusSendingAmount(assetId);
            uint256 globalPoolBalance = handler.getGlobalPoolBalance(assetId);
            assertEq(
                globalPoolBalance,
                globalOftSupply + globalTvl + globalBusAmount,
                "global_oft_supply_equals_global_surplus failed"
            );
        }
    }

    function invariant_all() public {
        invariant_total_credit_equals_pool_balance();
        invariant_global_oft_supply_equals_global_surplus();
        invariant_no_extra_native();
        print_credits_distribution();
        print_summary_on_finish();
    }

    function print_summary_on_finish() internal view {
        uint256 totalCalls = handler.totalBoundedCalls();
        if (totalCalls == TestConfig.DEPTH) {
            handler.printCallSummary("StargateInvariantTest");
        }
    }

    function print_credits_distribution() internal view {
        uint256 totalCalls = handler.totalBoundedCalls();
        if (totalCalls == TestConfig.DEPTH) {
            handler.printCreditsDistribution();
        }
    }
}

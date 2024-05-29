// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { PoolToken } from "../../src/mocks/PoolToken.sol";
import { StargateOFT } from "../../src/StargateOFT.sol";
import { StargatePool } from "../../src/StargatePool.sol";
import { StargateBase } from "../../src/StargateBase.sol";
import { FeeLibV1, FeeConfig } from "../../src/feelibs/FeeLibV1.sol";
import { TokenMessaging } from "../../src/messaging/TokenMessaging.sol";
import { CreditMessaging } from "../../src/messaging/CreditMessaging.sol";
import { StargateType, IStargate } from "../../src/interfaces/IStargate.sol";
import { ComposerMock } from "../mocks/ComposerMock.sol";
import { LzFixture } from "../layerzero/LzTestHelper.sol";
import { StargateFixture, StargateTestHelper } from "../StargateTestHelper.sol";
import { IMinterManager, MigrationTestBase } from "./MigrationTestBase.sol";
import { PathLib } from "../../src/libs/Path.sol";
import { StargatePoolMigratable } from "../../src/StargatePoolMigratable.sol";

contract OFTPoolToPoolMigrationTest is Test, MigrationTestBase {
    bool internal constant TRANSFER_OWNERSHIP_TO_SG = true;

    function setUpTest(bool _useOFTTokenERC20Upgradeable) public {
        super.setUpMigrationTest(TRANSFER_OWNERSHIP_TO_SG, _useOFTTokenERC20Upgradeable);
    }

    /// @notice Test the migration from a Pool to an OFT
    /// @param _useOFTTokenERC20Upgradeable Whether to use the upgradeable version of the OFT token.
    function test_migration(uint256 _amountLD, bool _useOFTTokenERC20Upgradeable) public {
        this.setUpTest(_useOFTTokenERC20Upgradeable);
        _amountLD = assumeAmountLD(_amountLD);

        // ----------- Migration stage 0: Setup
        StargateFixture memory fixturePool = stargateFixtures[STARGATE_POOL_FIXTURE_INDEX][ASSET_ID];
        StargateFixture memory fixtureOFT = stargateFixtures[STARGATE_OFT_FIXTURE_INDEX][ASSET_ID];

        // make a deposit to inject some credits into the system
        vm.startPrank(fixturePool.stargate);
        mintAndAddLiquidity(ALICE, fixturePool.stargate, 10 * _amountLD);
        assertCredit(fixturePool.stargate, fixturePool.eid, 10 * _amountLD);

        // fund ALICE on the pool chain
        PoolToken tokenPool = PoolToken(fixturePool.token);
        vm.prank(fixturePool.stargate);
        tokenPool.mint(ALICE, 20 * _amountLD);

        // send some tokens to the OFT chain
        sendTaxiAndRelay(ALICE, fixturePool.stargate, fixtureOFT.eid, 5 * _amountLD, ALICE, "");
        assertCredit(fixturePool.stargate, fixturePool.eid, 15 * _amountLD);
        assertSupply(fixtureOFT, 5 * _amountLD);

        // as the planner, take these credits and send them to the OFT on behalf of the pool
        sendCreditAndRelay(fixturePool.stargate, fixtureOFT.eid, fixturePool.eid, ldToSd(5 * _amountLD));

        // State at this point:
        // Pool chain: SG has amount liquidity, ALICE has 5*amount tokens, Pool to SG has infinite credit
        // OFT  chain: SG has zero liquidity, ALICE has 5*amount tokens, SG to Pool has 5*amount credit
        assertCredit(fixturePool.stargate, fixturePool.eid, 10 * _amountLD);
        assertCredit(fixturePool.stargate, fixtureOFT.eid, sdToLd(type(uint64).max)); // paths towards OFT have infinite credit
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 5 * _amountLD);
        assertCredit(fixtureOFT.stargate, fixtureOFT.eid, 0); // only pools have liquidity
        assertBalance(fixturePool, 15 * _amountLD);
        assertBalance(fixtureOFT, 0);

        // send some tokens back from OFT to pool to show that it works
        sendTaxiAndRelay(ALICE, fixtureOFT.stargate, fixturePool.eid, _amountLD, ALICE, "");
        assertCredit(fixturePool.stargate, fixturePool.eid, 10 * _amountLD);
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 4 * _amountLD);
        assertBalance(fixturePool, 14 * _amountLD);
        assertSupply(fixtureOFT, 4 * _amountLD);

        // sit some passengers to-A
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, _amountLD, ALICE, false);
        assertBalance(fixturePool, 15 * _amountLD);
        assertSupply(fixtureOFT, 4 * _amountLD);

        // sit some passengers from-A
        rideBus(ALICE, fixtureOFT.stargate, fixtureOFT.eid, fixturePool.eid, _amountLD, ALICE, false);
        assertBalance(fixturePool, 15 * _amountLD);
        assertSupply(fixtureOFT, 3 * _amountLD);

        // ----------- Migration stage 1: Disconnect

        // 1.a Pause all new send() activities by path in the fee lib
        vm.prank(fixtureOFT.feeLib.owner());
        fixtureOFT.feeLib.setPaused(fixturePool.eid, true);
        vm.prank(fixturePool.feeLib.owner());
        fixturePool.feeLib.setPaused(fixtureOFT.eid, true);

        // Assert that nobody can send after this point
        assertSendDisabled(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, _amountLD, ALICE);
        assertSendDisabled(ALICE, fixtureOFT.stargate, fixtureOFT.eid, fixturePool.eid, _amountLD, ALICE);

        // 1.b Drive all buses from-A and to-A
        driveBus(PLANNER, fixturePool.eid, fixtureOFT.eid, 0);
        assertBalance(fixturePool, 15 * _amountLD);
        driveBus(PLANNER, fixtureOFT.eid, fixturePool.eid, 0);
        assertCredit(fixturePool.stargate, fixturePool.eid, 11 * _amountLD);
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 3 * _amountLD);
        assertBalance(fixturePool, 15 * _amountLD); // bus has been driven but packet not relayed yet

        // 1.d Clear all credits

        // 1.d.1 Disable unlimited credits by calling stargate.setOFTPath() to-A
        StargateBase(fixturePool.stargate).setOFTPath(fixtureOFT.eid, false);

        // 1.d.2 Move all credits from-A to other chains by calling creditMessaging.sendCredit()
        sendCredit(fixtureOFT.stargate, fixturePool.eid, fixturePool.eid, ldToSd(3 * _amountLD));
        assertCredit(fixturePool.stargate, fixturePool.eid, 11 * _amountLD); // packet not yet processed
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 0);

        uint64 credit = _getCredit(fixtureOFT.stargate, fixturePool.eid);
        assertEq(0, credit);

        // 1.e Clear all inflights from-A and to-A
        verifyAndExecutePackets(); // now packets gets processed on pool chain
        assertCredit(fixturePool.stargate, fixturePool.eid, 14 * _amountLD);
        assertBalance(fixturePool, 14 * _amountLD);
        assertSupply(fixtureOFT, 4 * _amountLD);

        // ----------- Migration stage 2: Transfer
        // 2.a Revoke the minter role from StargateOFT
        vm.prank(fixtureOFT.stargate);
        IMinterManager(fixtureOFT.token).removeMinter(fixtureOFT.stargate);

        // 2.b Coordinate with Tether to burn X out from global stargate pools.
        // give token.owner() at the pool contract to remove some allocated credits and asset out by calling stargate.burnCredit().

        StargatePoolMigratable(fixturePool.stargate).allowBurn(
            address(this),
            ldToSd(PoolToken(fixtureOFT.token).totalSupply())
        );
        uint256 expectedBalanceLd = StargatePoolMigratable(fixturePool.stargate).poolBalance() -
            sdToLd(StargatePoolMigratable(fixturePool.stargate).burnAllowanceSD());
        vm.expectEmit();
        emit PathLib.Path_CreditBurned(ldToSd(PoolToken(fixtureOFT.token).totalSupply())); // repeated from above to avoid stack too deep
        StargatePoolMigratable(fixturePool.stargate).burnLocked();
        assertEq(StargatePoolMigratable(fixturePool.stargate).burnAllowanceSD(), 0);
        assertEq(StargatePoolMigratable(fixturePool.stargate).poolBalance(), expectedBalanceLd);
        assertCredit(fixturePool.stargate, fixturePool.eid, 10 * _amountLD);
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 0);
        assertBalance(fixturePool, 10 * _amountLD);
        assertBalance(fixtureOFT, 0);

        // ----------- Migration stage 3: reconnect
        // 3.a Deploy StargatePool contract on chain A and set it on the messaging contract
        StargatePoolMigratable newSG = new StargatePoolMigratable(
            "StargatePoolMigratable",
            "SMG",
            fixtureOFT.token,
            IERC20Metadata(fixtureOFT.token).decimals(),
            6,
            address(endpoints[fixtureOFT.eid]),
            address(this)
        );
        StargateFixture memory fixtureNewPool = fixtureOFT;
        fixtureNewPool.stargate = address(newSG);

        // A new SG contract requires a new FeeLib
        FeeLibV1 newFeeLib = new FeeLibV1(fixtureNewPool.stargate);

        // Configure the SG contract
        newSG.setAddressConfig(
            StargateBase.AddressConfig(
                address(newFeeLib),
                PLANNER,
                address(this),
                address(fixtureNewPool.tokenMessaging),
                address(fixtureNewPool.creditMessaging),
                address(0)
            )
        );

        // Configure the new fee lib, make sure it is paused
        uint32 dstEid = fixturePool.eid;

        vm.prank(newFeeLib.owner());
        newFeeLib.setPaused(dstEid, true);
        newFeeLib.setFeeConfig(
            dstEid,
            10000000000, // zone1UpperBound: 0 - 10_000 SD: zone1
            20000000000, // zone2UpperBound: 10_000 - 20_000 SD: zone2,  20_000 SD - unlimited: zone3
            0, // zone1FeeMillionth: no fee for zone1
            0, // zone2FeeMillionth: no fee for zone2
            0, // zone3FeeMillionth: no fee for zone3
            0 // rewardMillionth: no reward
        );

        // 3.b Set the new SG contract on the messaging contracts
        fixtureNewPool.tokenMessaging.setAssetId(fixtureNewPool.stargate, ASSET_ID);
        fixtureNewPool.creditMessaging.setAssetId(fixtureNewPool.stargate, ASSET_ID);

        // 3.c stargate.owner(): calls stargate.setOFTPath() and stargate.sendCredit() for all paths to-A and from-A
        // NOTE: Because the OFT contract never held any tokens, newPool.credit[newPool] == 0
        sendCreditAndRelay(fixturePool.stargate, fixtureNewPool.eid, fixturePool.eid, ldToSd(4 * _amountLD));
        assertCredit(fixturePool.stargate, fixturePool.eid, 6 * _amountLD);
        assertCredit(fixtureNewPool.stargate, fixturePool.eid, 4 * _amountLD);
        assertBalance(fixturePool, 10 * _amountLD);
        assertBalance(fixtureNewPool, 0);

        // 3.d Unpause all send() activities in the FeeLib
        vm.prank(newFeeLib.owner());
        newFeeLib.setPaused(fixturePool.eid, false);
        vm.prank(fixturePool.feeLib.owner());
        fixturePool.feeLib.setPaused(fixtureNewPool.eid, false);

        // test that taxi is operational again
        sendTaxiAndRelay(ALICE, fixtureNewPool.stargate, fixturePool.eid, _amountLD, ALICE, "");
        assertBalance(fixtureNewPool, _amountLD);
        assertBalance(fixturePool, 9 * _amountLD);

        sendCreditAndRelay(fixtureNewPool.stargate, fixturePool.eid, fixtureNewPool.eid, ldToSd(_amountLD));
        sendTaxiAndRelay(ALICE, fixturePool.stargate, fixtureNewPool.eid, _amountLD, ALICE, "");

        vm.prank(Ownable(fixtureNewPool.token).owner());
        IMinterManager(fixtureNewPool.token).addMinter(address(this));

        // add some tokens to the new pool
        mintAndAddLiquidity(ALICE, fixtureNewPool.stargate, 4 * _amountLD);

        // assert the state of the system after migration
        assertCredit(fixturePool.stargate, fixturePool.eid, 7 * _amountLD);
        assertCredit(fixturePool.stargate, fixtureNewPool.eid, 0);
        assertCredit(fixtureNewPool.stargate, fixturePool.eid, 3 * _amountLD);
        assertCredit(fixtureNewPool.stargate, fixtureNewPool.eid, 4 * _amountLD);
        assertBalance(fixturePool, 10 * _amountLD);
        assertBalance(fixtureNewPool, 4 * _amountLD);

        // assert invariants

        // 1. for each pool, pool balance >=  local unallocated credits + sum of allocated credits in remote paths
        {
            uint256 poolBalance = ldToSd(PoolToken(fixturePool.token).balanceOf(fixturePool.stargate));
            uint256 localUnallocated = _getCredit(fixturePool.stargate, fixturePool.eid);
            uint256 sumRemotePaths = _getCredit(fixtureNewPool.stargate, fixturePool.eid);
            assertEq(poolBalance, localUnallocated + sumRemotePaths);
        }
        {
            uint256 poolBalance = ldToSd(PoolToken(fixtureNewPool.token).balanceOf(fixtureNewPool.stargate));
            uint256 localUnallocated = _getCredit(fixtureNewPool.stargate, fixtureNewPool.eid);
            uint256 sumRemotePaths = _getCredit(fixturePool.stargate, fixtureNewPool.eid);
            assertEq(poolBalance, localUnallocated + sumRemotePaths);
        }

        // 2. sum of pool balances >= sum of oft supplies + sum of tvls
        {
            uint256 sumOfPoolBalances = PoolToken(fixturePool.token).balanceOf(fixturePool.stargate) +
                PoolToken(fixtureNewPool.token).balanceOf(fixtureNewPool.stargate);
            uint256 sumOFTSupplies = 0; // since we do not have OFTs anymore, oft supplies = 0
            uint256 sumOfTVLs = StargatePool(fixturePool.stargate).tvl() + StargatePool(fixtureNewPool.stargate).tvl();
            assertEq(sumOfPoolBalances, sumOFTSupplies + sumOfTVLs);
        }
    }
}

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { PoolToken } from "../../src/mocks/PoolToken.sol";
import { StargateOFT } from "../../src/StargateOFT.sol";
import { StargateOFTEURC } from "../../src/eurc/StargateOFTEURC.sol";
import { StargateOFTUSDC } from "../../src/usdc/StargateOFTUSDC.sol";
import { StargatePool } from "../../src/StargatePool.sol";
import { StargatePoolEURC } from "../../src/eurc/StargatePoolEURC.sol";
import { StargatePoolUSDC } from "../../src/usdc/StargatePoolUSDC.sol";
import { StargateBase } from "../../src/StargateBase.sol";
import { FeeLibV1, FeeConfig } from "../../src/feelibs/FeeLibV1.sol";
import { TokenMessaging } from "../../src/messaging/TokenMessaging.sol";
import { CreditMessaging } from "../../src/messaging/CreditMessaging.sol";
import { StargateType } from "../../src/interfaces/IStargate.sol";
import { ComposerMock } from "../mocks/ComposerMock.sol";
import { LzFixture } from "../layerzero/LzTestHelper.sol";
import { StargateFixture, StargateTestHelper } from "../StargateTestHelper.sol";
import { FiatTokenV2_2 } from "../../src/usdc/impl/v2/FiatTokenV2_2.sol";
import { FiatTokenProxy } from "../../src/usdc/impl/v1/FiatTokenProxy.sol";

// This test exercises the scenario where we have EURC/USDC as an OFT and we want to migrate it to a Pool,
// while conforming to the EURC/USDC bridged contract standard. In this case we deploy the actual EURC/USDC contracts
// and transfer ownership to simulate a real migration of EURC/USDC to native EURC/USDC.
abstract contract FiatTokenRealMigrationTest is Test, StargateTestHelper {
    uint16 private constant ASSET_ID = 1;
    uint8 private constant NUM_CHAINS = 2;

    bool internal isEURC;

    string internal tokenName;
    string internal tokenSymbol;
    string internal poolName;
    string internal poolSymbol;
    string internal newPoolName;
    string internal newPoolSymbol;

    address private ALICE = makeAddr("alice");
    address private BOB = makeAddr("bob");
    address private DRIVER = makeAddr("driver");
    address private PLANNER = makeAddr("planner");
    address private TOKEN_ROLE = makeAddr("tokenRole");
    address private TOKEN_ADMIN = makeAddr("tokenAdmin");

    // Setup an initial EURC/USDC pool and a EURC/USDC OFT contracts and wire them.
    function setUp() public virtual {
        // create two chains
        LzFixture[] memory lzFixtures = setUpEndpoints(NUM_CHAINS);

        {
            // Set up an initial EURC/USDC pool
            uint32 eid = lzFixtures[0].eid;
            TokenMessaging tokenMessaging = new TokenMessaging(
                address(lzFixtures[0].endpoint),
                address(this),
                QUEUE_CAPACITY
            );
            tokenMessagingList.push(tokenMessaging);
            tokenMessagingByEid[eid] = tokenMessaging;

            CreditMessaging creditMessaging = new CreditMessaging(address(lzFixtures[0].endpoint), address(this));
            creditMessagingList.push(creditMessaging);
            creditMessagingByEid[eid] = creditMessaging;

            address lpAddress;
            StargateType stargateType = StargateType.Pool;
            address sgAddress;

            FiatTokenV2_2 token = deployTokenAndProxy();
            // creates either a StargatePoolEURC or StargatePoolUSDC contract
            StargatePool sg = _createFiatTokenPool(isEURC, token, address(lzFixtures[0].endpoint), false);

            lpAddress = sg.lpToken();
            stargateType = StargateType.Pool;
            sgAddress = address(sg);
            token.configureMinter(sgAddress, 100_000_000_000 * 10 ** token.decimals());

            FeeLibV1 feeLib = new FeeLibV1(sgAddress);
            StargateBase(sgAddress).setAddressConfig(
                StargateBase.AddressConfig(
                    address(feeLib),
                    address(this),
                    address(this),
                    address(tokenMessaging),
                    address(creditMessaging),
                    address(0)
                )
            );

            StargateFixture memory fixture = StargateFixture({
                eid: eid,
                assetId: ASSET_ID,
                lz: lzFixtures[0],
                tokenMessaging: tokenMessaging,
                creditMessaging: creditMessaging,
                token: address(token),
                lp: lpAddress,
                stargate: sgAddress,
                feeLib: FeeLibV1(feeLib),
                stargateType: stargateType,
                composer: new ComposerMock()
            });
            // store stargate by eid and asset
            stargateFixtures[eid][ASSET_ID] = fixture;
            // store stargate fixture
            stargateFixtureList.push(fixture);
        }

        {
            // Set up an initial EURC/USDC OFT
            uint32 eid = lzFixtures[1].eid;
            TokenMessaging tokenMessaging = new TokenMessaging(
                address(lzFixtures[1].endpoint),
                address(this),
                QUEUE_CAPACITY
            );
            tokenMessagingList.push(tokenMessaging);
            tokenMessagingByEid[eid] = tokenMessaging;

            CreditMessaging creditMessaging = new CreditMessaging(address(lzFixtures[1].endpoint), address(this));
            creditMessagingList.push(creditMessaging);
            creditMessagingByEid[eid] = creditMessaging;

            address tokenAddress;
            address lpAddress;
            StargateType stargateType = StargateType.Pool;
            address sgAddress;

            FiatTokenV2_2 token = deployTokenAndProxy();
            tokenAddress = address(token);
            // creates either a StargateOFTEURC or StargateOFTUSDC contract
            StargateOFT sg = _createFiatTokenOFT(isEURC, token, address(lzFixtures[1].endpoint));
            stargateType = StargateType.OFT;
            sgAddress = address(sg);
            token.configureMinter(sgAddress, 100_000_000_000 * 10 ** token.decimals());

            FeeLibV1 feeLib = new FeeLibV1(sgAddress);
            StargateBase(sgAddress).setAddressConfig(
                StargateBase.AddressConfig(
                    address(feeLib),
                    address(this),
                    address(this),
                    address(tokenMessaging),
                    address(creditMessaging),
                    address(0)
                )
            );

            StargateFixture memory fixture = StargateFixture({
                eid: eid,
                assetId: ASSET_ID,
                lz: lzFixtures[1],
                tokenMessaging: tokenMessaging,
                creditMessaging: creditMessaging,
                token: tokenAddress,
                lp: lpAddress,
                stargate: sgAddress,
                feeLib: FeeLibV1(feeLib),
                stargateType: stargateType,
                composer: new ComposerMock()
            });
            // store stargate by eid and asset
            stargateFixtures[eid][ASSET_ID] = fixture;
            // store stargate fixture
            stargateFixtureList.push(fixture);
        }

        for (uint256 i = 0; i < NUM_CHAINS; i++) {
            uint32 eid = lzFixtures[i].eid;
            TokenMessaging tokenMessaging = tokenMessagingList[i];
            tokenMessaging.setPlanner(address(this));
            CreditMessaging creditMessaging = creditMessagingList[i];
            creditMessaging.setPlanner(address(this));

            for (uint256 j = 0; j < NUM_CHAINS; j++) {
                uint32 dstEid = lzFixtures[j].eid;
                if (eid == dstEid) continue; // skip rollback to itself
                tokenMessaging.setFares(dstEid, BUS_FARE, NATIVE_DROP_FARE);
                tokenMessaging.setNativeDropAmount(dstEid, NATIVE_DROP_AMOUNT);
                tokenMessaging.setMaxNumPassengers(dstEid, BUS_PASSENGER_CAPACITY);
                setEnforcedOptions(tokenMessaging, dstEid);
                // config stargate by asset

                StargateBase sg = StargateBase(stargateFixtures[eid][ASSET_ID].stargate);
                if (j == 1) {
                    sg.setOFTPath(dstEid, true);
                }

                // config fee
                FeeLibV1 feeLib = stargateFixtures[eid][ASSET_ID].feeLib;
                // no fee
                feeLib.setFeeConfig(
                    dstEid,
                    10000000000, // zone1UpperBound: 0 - 10_000 SD: zone1
                    20000000000, // zone2UpperBound: 10_000 - 20_000 SD: zone2,  20_000 SD - unlimited: zone3
                    0, // zone1FeeMillionth: no fee for zone1
                    0, // zone2FeeMillionth: no fee for zone2
                    0, // zone3FeeMillionth: no fee for zone3
                    0 // rewardMillionth: no reward
                );

                // config messaging by eidPath + assetId
                tokenMessaging.setAssetId(address(sg), ASSET_ID);
                creditMessaging.setAssetId(address(sg), ASSET_ID);
                tokenMessaging.setGasLimit(dstEid, MIN_TOKEN_GAS, NATIVE_DROP_GAS_LIMIT);

                creditMessaging.setGasLimit(dstEid, MIN_CREDIT_GAS);
                // common oapp config
                address tokenPeer = address(tokenMessagingList[j]);
                tokenMessaging.setPeer(dstEid, addressToBytes32(tokenPeer));
                address creditPeer = address(creditMessagingList[j]);
                creditMessaging.setPeer(dstEid, addressToBytes32(creditPeer));
            }
        }
    }

    // Show that messaging works and then replace the OFT with a Pool on top of real EURC/USDC contracts.
    function test_migration() public {
        // ----------- Migration stage 0: Setup
        StargateFixture memory fixturePool = stargateFixtures[1][ASSET_ID];
        StargateFixture memory fixtureOFT = stargateFixtures[2][ASSET_ID];
        uint256 amount = 1e15;

        // make a deposit to inject some credits into the system
        vm.startPrank(fixturePool.stargate); // mintAndLiquidity has more than 1 call inside
        mintAndAddLiquidity(ALICE, fixturePool.stargate, 10 * amount);
        assertCredit(fixturePool.stargate, fixturePool.eid, 10 * amount);

        // fund ALICE on the pool chain
        PoolToken tokenPool = PoolToken(fixturePool.token);
        vm.prank(fixturePool.stargate);
        tokenPool.mint(ALICE, 20 * amount);

        // send some tokens to the OFT chain
        sendTaxiAndRelay(ALICE, fixturePool.stargate, fixtureOFT.eid, 5 * amount, ALICE, "");
        assertCredit(fixturePool.stargate, fixturePool.eid, 15 * amount);
        assertSupply(fixtureOFT, 5 * amount);

        // as the planner, take these credits and send them to the OFT on behalf of the pool
        sendCreditAndRelay(fixturePool.stargate, fixtureOFT.eid, fixturePool.eid, ldToSd(5 * amount));

        // State at this point:
        // Pool chain: SG has amount liquidity, ALICE has 5*amount tokens, Pool to SG has infinite credit
        // OFT  chain: SG has zero liquidity, ALICE has 5*amount tokens, SG to Pool has 5*amount credit
        assertCredit(fixturePool.stargate, fixturePool.eid, 10 * amount);
        assertCredit(fixturePool.stargate, fixtureOFT.eid, sdToLd(type(uint64).max)); // paths towards OFT have infinite credit
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 5 * amount);
        assertCredit(fixtureOFT.stargate, fixtureOFT.eid, 0); // only pools have liquidity
        assertBalance(fixturePool, 15 * amount);
        assertBalance(fixtureOFT, 0);

        // send some tokens back from OFT to pool to show that it works
        sendTaxiAndRelay(ALICE, fixtureOFT.stargate, fixturePool.eid, amount, ALICE, "");
        assertCredit(fixturePool.stargate, fixturePool.eid, 10 * amount);
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 4 * amount);
        assertBalance(fixturePool, 14 * amount);
        assertSupply(fixtureOFT, 4 * amount);

        // sit some passengers to-A
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amount, ALICE, false);
        assertBalance(fixturePool, 15 * amount);
        assertSupply(fixtureOFT, 4 * amount);

        // sit some passengers from-A
        rideBus(ALICE, fixtureOFT.stargate, fixtureOFT.eid, fixturePool.eid, amount, ALICE, false);
        assertBalance(fixturePool, 15 * amount);
        assertSupply(fixtureOFT, 3 * amount);

        // Following the EURC/USDC bridged contract standard: https://github.com/circlefin/stablecoin-evm/blob/master/doc/bridged_USDC_standard.md
        // I. Third-party team follows the standard to deploy their bridge contracts,
        // or retains the ability to upgrade their bridge contracts in the future to
        // incorporate the required functionality.

        // We achieve this by deploying the EURC/USDC contracts as the ERC20 which we wrap around with the StargateOFTEURC/StargateOFTUSDC contract
        // and StargatePoolEURC/StargatePoolUSDC contracts; the latter of which supports burning tokens.
        // Bridge contracts must have two features:
        // A. (Source and destination blockchains) Ability to pause EURC/USDC bridging to create a lock on the supply.
        // B. (Source blockchain) Ability to burn locked EURC/USDC.
        // Both contracts can be paused by configuring their FeeLibs to be paused, achieving A.
        // The StargatePoolEURC/StargatePoolUSDC contract can burn EURC/USDC, achieving B.

        // II. Third-party team follows the standard to deploy their bridged EURC/USDC token contract.
        // This is achieved by initially deploying the EURC/USDC contracts (see setup)

        // III. Third-party team securely transfers ownership of the bridged EURC/USDC token contract to Circle and performs an upgrade to native EURC/USDC.
        // This is subdivided into three stages: disconnect, transfer, and reconnect.

        // DISCONNECT: Third-party team will pause bridging activity and reconcile in-flight bridging activity to harmonize the total supply of
        // native EURC/USDC locked on the origin chain with the total supply of bridged EURC/USDC on the destination chain.

        // TRANSFER: Third-party team will securely re-assign the contract roles of the bridged EURC/USDC token contract to Circle.

        // RECONNECT: Circle and the third-party team will jointly coordinate to burn the supply of native EURC/USDC locked in the bridge contract on
        // the origin chain and upgrade the bridged EURC/USDC token contract on the destination chain to native EURC/USDC.

        // These steps are implemented below.

        // ----------- Migration stage 1: Disconnect

        // 1.a Pause all new send() activities by path in the fee lib
        fixtureOFT.feeLib.setPaused(fixturePool.eid, true);
        fixturePool.feeLib.setPaused(fixtureOFT.eid, true);

        // Assert that nobody can send after this point
        assertSendDisabled(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amount, ALICE);
        assertSendDisabled(ALICE, fixtureOFT.stargate, fixtureOFT.eid, fixturePool.eid, amount, ALICE);

        // 1.b Drive all buses from-A and to-A
        driveBus(PLANNER, fixturePool.eid, fixtureOFT.eid, 0);
        assertBalance(fixturePool, 15 * amount);
        driveBus(PLANNER, fixtureOFT.eid, fixturePool.eid, 0);
        assertCredit(fixturePool.stargate, fixturePool.eid, 11 * amount);
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 3 * amount);
        assertBalance(fixturePool, 15 * amount); // bus has been driven but packet not relayed yet

        // 1.d Clear all credits

        // 1.d.1 Disable unlimited credits by calling stargate.setOFTPath() to-A
        StargateBase(fixturePool.stargate).setOFTPath(fixtureOFT.eid, false);

        // 1.d.2 Move all credits from-A to other chains by calling creditMessaging.sendCredit()
        sendCredit(fixtureOFT.stargate, fixturePool.eid, fixturePool.eid, ldToSd(3 * amount));
        assertCredit(fixturePool.stargate, fixturePool.eid, 11 * amount); // packet not yet processed
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 0);

        uint64 credit = _getCredit(fixtureOFT.stargate, fixturePool.eid);
        assertEq(0, credit);

        // 1.e Clear all inflights from-A and to-A
        verifyAndExecutePackets(); // now packets gets processed on pool chain
        assertCredit(fixturePool.stargate, fixturePool.eid, 14 * amount);
        assertBalance(fixturePool, 14 * amount);
        assertSupply(fixtureOFT, 4 * amount);

        // 1.f Clear all unreceivedTokens on A
        // NOTE: Not simulated here
        // StargateOFTUSDC(fixtureOFT.stargate).retryReceiveToken();

        // ----------- Migration stage 2: Transfer

        // 2.a Revoke the minter role from StargateOFT by master minter contract
        FiatTokenV2_2(fixtureOFT.token).removeMinter(fixtureOFT.stargate);
        FiatTokenV2_2(fixtureOFT.token).updateMasterMinter(TOKEN_ROLE);
        FiatTokenV2_2(fixtureOFT.token).updateBlacklister(TOKEN_ROLE);
        FiatTokenV2_2(fixtureOFT.token).updatePauser(TOKEN_ROLE);
        FiatTokenV2_2(fixtureOFT.token).updateRescuer(TOKEN_ROLE);
        FiatTokenV2_2(fixtureOFT.token).transferOwnership(TOKEN_ROLE);
        vm.prank(PLANNER);
        FiatTokenProxy(payable(fixtureOFT.token)).changeAdmin(TOKEN_ADMIN);

        // NOTE: This is actually part of step 3, reconnect, but in our internal docs it is refered as 2.b
        // 2.b Coordinate with Circle to burn X out from global stargate EURC/USDC pools.
        // give token.owner() at the pool contract to remove some allocated credits and asset out by calling stargate.burnCredit().

        // When sending to an OFT contract, no credit is burned because there is no loss of liquidity on the OFT contract (since it can mint,
        // it has infinite liquidity). This also means that we have excess asset, but it is ok since the excess is in the Stargate contract.
        //  When switching to a Pool contract, we must "retroactively" burn the credit in the amount that has been
        // transfered to this OFT contract, as well as burn the excess asset. That amount is exactly the total supply of tokens.
        // StargatePoolEURC/StargatePoolUSDC implements burnCredit which burns both credit and asset.
        StargatePoolUSDC(fixturePool.stargate).allowBurn(
            address(this),
            ldToSd(PoolToken(fixtureOFT.token).totalSupply())
        );
        if (isEURC) {
            StargatePoolEURC(fixturePool.stargate).burnLockedEURC();
        } else {
            StargatePoolUSDC(fixturePool.stargate).burnLockedUSDC();
        }
        assertCredit(fixturePool.stargate, fixturePool.eid, 10 * amount);
        assertCredit(fixtureOFT.stargate, fixturePool.eid, 0);
        assertBalance(fixturePool, 10 * amount);
        assertBalance(fixtureOFT, 0);

        // ----------- Migration stage 3: reconnect
        FiatTokenV2_2 tokenOFT = FiatTokenV2_2(fixtureOFT.token);

        // 3.a Deploy StargatePool contract on chain A and set it on the messaging contract
        // creates either a StargatePoolEURC or StargatePoolUSDC contract
        StargatePool newSG = _createFiatTokenPool(isEURC, tokenOFT, address(endpoints[fixtureOFT.eid]), true);

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

        newFeeLib.setPaused(dstEid, true);
        newFeeLib.setFeeConfig(
            dstEid,
            10000000000, // 0 - 10_000 SD: zone1
            20000000000, // 10_000 - 20_000 SD: zone2,  20_000 SD - unlimited: zone3
            0, // no fee for zone1
            0, // no fee for zone2
            0, // no fee for zone3
            0 // no reward
        );

        // 3.b Set the new SG contract on the messaging contracts
        fixtureNewPool.tokenMessaging.setAssetId(fixtureNewPool.stargate, ASSET_ID);
        fixtureNewPool.creditMessaging.setAssetId(fixtureNewPool.stargate, ASSET_ID);

        // 3.c stargate.owner(): calls stargate.setOFTPath() and stargate.sendCredit() for all paths to-A and from-A
        // NOTE: Because the OFT contract never held any tokens, newPool.credit[newPool] == 0
        sendCreditAndRelay(fixturePool.stargate, fixtureNewPool.eid, fixturePool.eid, ldToSd(4 * amount));
        assertCredit(fixturePool.stargate, fixturePool.eid, 6 * amount);
        assertCredit(fixtureNewPool.stargate, fixturePool.eid, 4 * amount);
        assertBalance(fixturePool, 10 * amount);
        assertBalance(fixtureNewPool, 0);

        // 3.d Unpause all send() activities in the FeeLib
        newFeeLib.setPaused(fixturePool.eid, false);
        fixturePool.feeLib.setPaused(fixtureNewPool.eid, false);

        // show that it works
        sendTaxiAndRelay(ALICE, fixtureNewPool.stargate, fixturePool.eid, amount, ALICE, "");
        assertBalance(fixtureNewPool, amount);
        assertBalance(fixturePool, 9 * amount);

        sendCreditAndRelay(fixtureNewPool.stargate, fixturePool.eid, fixtureNewPool.eid, ldToSd(amount));
        sendTaxiAndRelay(ALICE, fixturePool.stargate, fixtureNewPool.eid, amount, ALICE, "");

        // add some tokens to the new pool
        vm.startPrank(TOKEN_ROLE);
        FiatTokenV2_2(fixtureNewPool.token).configureMinter(TOKEN_ROLE, 4 * amount);
        mintAndAddLiquidity(ALICE, fixtureNewPool.stargate, 4 * amount);

        // assert the state of the system after migration
        assertCredit(fixturePool.stargate, fixturePool.eid, 7 * amount);
        assertCredit(fixturePool.stargate, fixtureNewPool.eid, 0);
        assertCredit(fixtureNewPool.stargate, fixturePool.eid, 3 * amount);
        assertCredit(fixtureNewPool.stargate, fixtureNewPool.eid, 4 * amount);
        assertBalance(fixturePool, 10 * amount);
        assertBalance(fixtureNewPool, 4 * amount);

        // assert invariants

        // 1. for each pool, pool balance >=  local unallocated credits + sum of allocated credits in remote paths
        {
            uint256 poolBalance = ldToSd(PoolToken(fixturePool.token).balanceOf(fixturePool.stargate));
            uint256 localUnallocated = _getCredit(fixturePool.stargate, fixturePool.eid);
            uint256 sumRemotePaths = _getCredit(fixtureNewPool.stargate, fixturePool.eid);
            assert(poolBalance == localUnallocated + sumRemotePaths);
        }
        {
            uint256 poolBalance = ldToSd(PoolToken(fixtureNewPool.token).balanceOf(fixtureNewPool.stargate));
            uint256 localUnallocated = _getCredit(fixtureNewPool.stargate, fixtureNewPool.eid);
            uint256 sumRemotePaths = _getCredit(fixturePool.stargate, fixtureNewPool.eid);
            assert(poolBalance == localUnallocated + sumRemotePaths);
        }

        // 2. sum of pool balances >= sum of oft supplies + sum of tvls
        {
            uint256 sumOfPoolBalances = PoolToken(fixturePool.token).balanceOf(fixturePool.stargate) +
                PoolToken(fixtureNewPool.token).balanceOf(fixtureNewPool.stargate);
            uint256 sumOFTSupplies = 0; // since we do not have OFTs anymore, oft supplies = 0
            uint256 sumOfTVLs = StargatePool(fixturePool.stargate).tvl() + StargatePool(fixtureNewPool.stargate).tvl();
            assert(sumOfPoolBalances == sumOFTSupplies + sumOfTVLs);
        }

        // assert permissions: Owner, Pauser, Blacklister, MasterMinter, Minter, Rescuer, ProxyAdmin
        {
            FiatTokenV2_2 token = FiatTokenV2_2(fixtureNewPool.token);
            assertEq(TOKEN_ROLE, token.owner());
            assertEq(TOKEN_ROLE, token.pauser());
            assertEq(TOKEN_ROLE, token.blacklister());
            assertEq(TOKEN_ROLE, token.masterMinter());
            assertEq(TOKEN_ROLE, token.rescuer());
            assertEq(false, token.isMinter(fixtureNewPool.stargate));
            assertEq(TOKEN_ADMIN, FiatTokenProxy(payable(fixtureNewPool.token)).admin());
        }

        // assert initializations
        {
            FiatTokenV2_2 token = FiatTokenV2_2(fixtureNewPool.token);
            vm.expectRevert("FiatToken: contract is already initialized");
            token.initialize(
                "Random Name",
                "Random Symbol",
                "Random Currency",
                18,
                address(this),
                address(this),
                address(this),
                address(this)
            );
            vm.expectRevert();
            token.initializeV2("Random New Name");
            vm.expectRevert();
            token.initializeV2_1(address(this));
            vm.expectRevert();
            token.initializeV2_2(new address[](0), "Random New Symbol");
        }
        {
            FiatTokenV2_2 actualToken = FiatTokenV2_2(FiatTokenProxy(payable(fixtureNewPool.token)).implementation());
            vm.expectRevert("FiatToken: contract is already initialized");
            actualToken.initialize(
                "Random Name",
                "Random Symbol",
                "Random Currency",
                18,
                address(this),
                address(this),
                address(this),
                address(this)
            );
            vm.expectRevert();
            actualToken.initializeV2("Random New Name");
            vm.expectRevert();
            actualToken.initializeV2_1(address(this));
            vm.expectRevert();
            actualToken.initializeV2_2(new address[](0), "Random New Symbol");
        }
    }

    function assertCredit(address _stargate, uint32 _dstEid, uint256 _amount) internal {
        uint256 credit = _getCredit(_stargate, _dstEid);
        assertEq(ldToSd(_amount), credit);
    }

    function assertBalance(StargateFixture memory fixture, uint256 _amount) internal {
        PoolToken tokenPool = PoolToken(fixture.token);
        uint256 balance = tokenPool.balanceOf(fixture.stargate);
        assertEq(_amount, balance);
    }

    function assertSupply(StargateFixture memory fixture, uint256 _amount) internal {
        PoolToken tokenPool = PoolToken(fixture.token);
        uint256 supply = tokenPool.totalSupply();
        assertEq(_amount, supply);
    }

    function assertSendDisabled(
        address _sender,
        address _stargate,
        uint32 _srcEid,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver
    ) internal {
        try this.rideBusExternal(_sender, _stargate, _srcEid, _dstEid, _amount, _receiver, false) {
            revert("Expected bus to fail");
        } catch {}

        try this.sendTaxiExternal(_sender, _stargate, _dstEid, _amount) {
            revert("Expected taxi to fail");
        } catch {}
    }

    function rideBusExternal(
        address _sender,
        address _stargate,
        uint32 _srcEid,
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        bool nativeDrop
    ) external {
        rideBus(_sender, _stargate, _srcEid, _dstEid, _amount, _receiver, nativeDrop);
    }

    function sendTaxiExternal(address _sender, address _stargate, uint32 _dstEid, uint256 _amount) external {
        sendTaxi(_sender, _stargate, _dstEid, _amount, _sender, "");
    }

    function deployTokenAndProxy() internal returns (FiatTokenV2_2) {
        FiatTokenV2_2 fiatToken = new FiatTokenV2_2();
        // Call the initialization functions to disable them, but values are actually not relevant, since in practice the storage of the Proxy is used,
        // the token contract is only used for its code.
        fiatToken.initialize("", "", "", 0, address(1), address(1), address(1), address(1));
        fiatToken.initializeV2("");
        fiatToken.initializeV2_1(address(0));
        fiatToken.initializeV2_2(new address[](0), "");

        // Deploy the proxy contract as the Planner so it becomes the admin
        vm.prank(PLANNER);
        FiatTokenV2_2 fiatProxy = FiatTokenV2_2(address(new FiatTokenProxy(address(fiatToken))));
        // Call the initialization function in the Proxy
        fiatProxy.initialize(
            tokenName,
            tokenSymbol,
            isEURC ? "EUR" : "USD",
            18,
            address(this),
            address(this),
            address(this),
            address(this)
        );
        fiatProxy.initializeV2(tokenName);
        fiatProxy.initializeV2_1(address(this));
        fiatProxy.initializeV2_2(new address[](0), tokenSymbol);

        return fiatProxy;
    }

    function _createFiatTokenPool(
        bool isEURC,
        FiatTokenV2_2 token,
        address endpoint,
        bool newPool
    ) internal returns (StargatePool sg) {
        if (isEURC) {
            sg = new StargatePoolEURC(
                newPool ? newPoolName : poolName,
                newPool ? newPoolSymbol : poolSymbol,
                address(token),
                token.decimals(),
                6,
                endpoint,
                address(this)
            );
        } else {
            sg = new StargatePoolUSDC(
                newPool ? newPoolName : poolName,
                newPool ? newPoolSymbol : poolSymbol,
                address(token),
                token.decimals(),
                6,
                endpoint,
                address(this)
            );
        }
    }

    function _createFiatTokenOFT(bool isEURC, FiatTokenV2_2 token, address endpoint) internal returns (StargateOFT sg) {
        if (isEURC) {
            sg = new StargateOFTEURC(address(token), 6, endpoint, address(this));
        } else {
            sg = new StargateOFTUSDC(address(token), 6, endpoint, address(this));
        }
    }
}

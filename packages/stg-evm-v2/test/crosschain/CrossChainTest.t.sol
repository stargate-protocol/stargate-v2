// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";

import { MessagingFee, SendParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { PoolToken } from "../../src/mocks/PoolToken.sol";
import { TargetCredit, TargetCreditBatch } from "../../src/interfaces/ICreditMessaging.sol";
import { PathLib } from "../../src/libs/Path.sol";
import { StargateBase } from "../../src/StargateBase.sol";
import { StargatePool } from "../../src/StargatePool.sol";
import { StargateType } from "../../src/interfaces/IStargate.sol";

import { OftCmdHelper } from "../utils/OftCmdHelper.sol";
import { StargateFixture, StargateTestHelper } from "../StargateTestHelper.sol";

contract CrossChainTest is Test, StargateTestHelper {
    address public ALICE = makeAddr("alice");
    address public BOB = makeAddr("bob");
    address public DRIVER = makeAddr("driver");

    uint8 internal NUM_ASSETS = 2;
    uint8 internal NUM_CHAINS = 5;
    uint8 internal NUM_NATIVE_POOLS = 1;
    uint8 internal NUM_OFTS = 2;
    uint8 internal NUM_POOLS = 2;

    uint8 internal constant MAX_BUS_CAPACITY = 200;

    function setUp() public {
        // 2 assets, each asset has 2 pools, 1 native pool, 2 OFTs
        setUpStargate(NUM_ASSETS, NUM_POOLS, NUM_NATIVE_POOLS, NUM_OFTS);
    }

    function test_SetUp() public {
        assertEq(stargateFixtureList.length, NUM_ASSETS * NUM_CHAINS);

        uint8 poolType = uint8(StargateType.Pool);
        uint8 oftType = uint8(StargateType.OFT);

        for (uint32 i = 0; i < NUM_CHAINS; i++) {
            uint32 eid = i + 1;

            bool isPool = i < 3;
            bool isNative = i == 2;
            bool isOFT = i >= 3;

            for (uint16 assetCount = 0; assetCount < NUM_ASSETS; assetCount++) {
                uint16 assetId = assetCount + 1;
                StargateFixture memory fixture = stargateFixtures[eid][assetId];
                if (isPool) {
                    assertEq(uint8(StargateBase(fixture.stargate).stargateType()), poolType);
                } else if (isNative) {
                    assertEq(uint8(StargateBase(fixture.stargate).stargateType()), poolType);
                    assertEq(StargateBase(fixture.stargate).token(), address(0)); // ensure native pool token is address(0)
                } else if (isOFT) {
                    assertEq(uint8(StargateBase(fixture.stargate).stargateType()), oftType);
                }

                // assert oft path
                for (uint32 j = 0; j < NUM_CHAINS; j++) {
                    uint32 toEid = j + 1;
                    if (eid == toEid) continue;

                    bool isDstOFT = j >= 3;
                    uint64 credit = StargateBase(fixture.stargate).paths(toEid);
                    if (isDstOFT) {
                        assertEq(credit, PathLib.UNLIMITED_CREDIT);
                    } else {
                        assertEq(credit, 0);
                    }
                }
            }
        }
    }

    function _safeSD2LD(uint64 _amountSD) internal pure returns (uint256 amountLD) {
        vm.assume(_amountSD > 0);
        amountLD = sdToLd(_amountSD);
        vm.assume(amountLD < type(uint64).max);
    }

    function test_Pool_To_NativePool_To_OFT_To_Pool_Taxi(uint64 _amountSD) public {
        uint256 amountLD = _safeSD2LD(_amountSD);

        // pool1 -> native pool -> oft1 -> pool2
        uint16 assetId = 1;
        StargateFixture memory fixturePool1 = stargateFixtures[1][assetId]; // pool1, asset1
        StargateFixture memory fixturePool2 = stargateFixtures[2][assetId]; // pool2, asset1
        StargateFixture memory fixtureNativePool = stargateFixtures[3][assetId]; // native pool, asset1
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId]; // oft1, asset1

        // add liquidity to native pool
        mintAndAddLiquidity(ALICE, fixtureNativePool.stargate, amountLD);
        // send credit from native pool to pool1
        sendCreditAndRelay(fixtureNativePool.stargate, fixturePool1.eid, fixtureNativePool.eid, ldToSd(amountLD));

        // mint tokens to alice on pool1
        PoolToken(fixturePool1.token).mint(ALICE, amountLD);

        uint256 beforeBalance = BOB.balance;
        // 1. send from pool1 to native pool
        sendTaxiAndRelay(ALICE, fixturePool1.stargate, fixtureNativePool.eid, amountLD, BOB, "");
        uint256 afterBalance = BOB.balance;
        // check balance on native pool
        assertEq(afterBalance, beforeBalance + amountLD);

        // 2. send from nativePool to oft1
        beforeBalance = PoolToken(fixtureOFT.token).balanceOf(BOB);
        sendTaxiAndRelay(BOB, fixtureNativePool.stargate, fixtureOFT.eid, amountLD, BOB, "");
        afterBalance = PoolToken(fixtureOFT.token).balanceOf(BOB);
        // check balance on oft1
        assertEq(afterBalance, beforeBalance + amountLD);

        // 3. send from oft1 to pool2
        // add liquidity to pool2
        mintAndAddLiquidity(ALICE, fixturePool2.stargate, amountLD);
        // send credit from pool2 to oft1
        sendCreditAndRelay(fixturePool2.stargate, fixtureOFT.eid, fixturePool2.eid, ldToSd(amountLD));
        beforeBalance = PoolToken(fixturePool2.token).balanceOf(BOB);
        sendTaxiAndRelay(BOB, fixtureOFT.stargate, fixturePool2.eid, amountLD, BOB, "");
        afterBalance = PoolToken(fixturePool2.token).balanceOf(BOB);
        // check balance on pool2
        assertEq(afterBalance, beforeBalance + amountLD);
    }

    function test_Pool_To_OFT_Taxi_With_ComposeMsg(
        uint64 _amountSD,
        uint128 _nativeDropAmount,
        bytes memory _composeMsg
    ) public {
        // 1. Assume a native drop amount and within LzTestHelper.executorValueCap.
        uint256 amountLD = _safeSD2LD(_amountSD);
        vm.assume(_nativeDropAmount <= executorValueCap);
        vm.assume(_composeMsg.length > 0);

        // 2. Mint ALICE tokens
        uint16 assetId = 1;
        StargateFixture memory fixturePool = stargateFixtures[1][assetId];
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId];
        // mint tokens to alice
        PoolToken(fixturePool.token).mint(ALICE, amountLD);

        // 3. Track the balance of OFT composer, which will be dropped _nativeDropAmount
        uint256 beforeBalance = address(fixtureOFT.composer).balance;
        uint256 composeAckCount = fixtureOFT.composer.ackCount();

        // 4. Send pool to oft with compose message.
        sendTaxiAndRelay(
            ALICE,
            fixturePool.stargate,
            fixtureOFT.eid,
            amountLD,
            address(fixtureOFT.composer),
            _composeMsg,
            _nativeDropAmount
        );

        // 5. Assert the balance of OFT composer, the balance of fixtureOFT, and the ack count is as expected.
        assertEq(address(fixtureOFT.composer).balance, beforeBalance + _nativeDropAmount);
        // check composer's balance on oft
        assertEq(PoolToken(fixtureOFT.token).balanceOf(address(fixtureOFT.composer)), amountLD);
        // check compose ack count
        assertEq(fixtureOFT.composer.ackCount(), composeAckCount + 1);
    }

    function test_SingleAsset_Ride_Bus(uint64 _amountSD) public {
        uint256 amountLD = _safeSD2LD(_amountSD);
        uint16 assetId = 1;
        StargateFixture memory fixturePool = stargateFixtures[1][assetId];
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId];
        // mint tokens to alice
        PoolToken(fixturePool.token).mint(ALICE, amountLD);

        // ride bus from pool to oft
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD);

        // the token has been locked in the bus, but not yet minted on the destination pool
        // check alice's balance on source pool
        assertEq(PoolToken(fixturePool.token).balanceOf(ALICE), 0);
        // check alice's balance on destination pool
        assertEq(PoolToken(fixtureOFT.token).balanceOf(ALICE), 0);
    }

    function test_SingleAsset_Drive_Bus(uint64 _amountSD) public {
        // Assume _amountSD is even, as sending half of the amount leads to easier test symmetry
        vm.assume(_amountSD % 2 == 0);
        uint256 amountLD = _safeSD2LD(_amountSD);
        uint16 assetId = 1;
        StargateFixture memory fixturePool = stargateFixtures[1][assetId];
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId];
        // mint tokens to alice and bob
        PoolToken(fixturePool.token).mint(ALICE, amountLD);
        PoolToken(fixturePool.token).mint(BOB, amountLD);

        // ride bus from pool to oft
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD / 2);
        rideBus(BOB, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD / 2);

        // drive bus
        driveBusAndRelay(DRIVER, fixturePool.eid, fixtureOFT.eid);

        // check alice's balance on source pool and destination pool
        assertEq(PoolToken(fixturePool.token).balanceOf(ALICE), amountLD / 2);
        assertEq(PoolToken(fixtureOFT.token).balanceOf(ALICE), amountLD / 2);
        // check bob's balance on source pool and destination pool
        assertEq(PoolToken(fixturePool.token).balanceOf(BOB), amountLD / 2);
        assertEq(PoolToken(fixtureOFT.token).balanceOf(BOB), amountLD / 2);

        /// second bus ride and drive

        // ride bus from pool to oft
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD / 2);
        rideBus(BOB, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD / 2);

        // drive bus
        driveBusAndRelay(DRIVER, fixturePool.eid, fixtureOFT.eid);

        // check alice's balance on source pool and destination pool
        assertEq(PoolToken(fixturePool.token).balanceOf(ALICE), 0);
        assertEq(PoolToken(fixtureOFT.token).balanceOf(ALICE), amountLD);
        // check bob's balance on source pool and destination pool
        assertEq(PoolToken(fixturePool.token).balanceOf(BOB), 0);
        assertEq(PoolToken(fixtureOFT.token).balanceOf(BOB), amountLD);
    }

    function test_SingleAsset_Drive_Bus_Partially(uint64 _amountSD) public {
        uint256 amountLD = _safeSD2LD(_amountSD);
        uint16 assetId = 1;
        StargateFixture memory fixturePool = stargateFixtures[1][assetId];
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId];

        // mint tokens to alice and bob
        PoolToken(fixturePool.token).mint(ALICE, amountLD * 3);
        PoolToken(fixturePool.token).mint(BOB, amountLD);

        // Alice ride bus from pool to oft 3 times
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD);
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD);
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD);
        // Bob ride and drive the bus with only 2 passengers
        driveBusAndRelay(BOB, fixturePool.eid, fixtureOFT.eid, 2);

        // check alice's balance on source pool and destination pool
        assertEq(PoolToken(fixturePool.token).balanceOf(ALICE), 0);
        assertEq(PoolToken(fixtureOFT.token).balanceOf(ALICE), amountLD * 2);
    }

    function test_SingleAsset_Drive_Bus_With_Native_Drop(uint64 _amountSD) public {
        uint256 amountLD = _safeSD2LD(_amountSD);
        uint16 assetId = 1;
        StargateFixture memory fixturePool = stargateFixtures[1][assetId];
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId];

        // mint tokens to alice
        PoolToken(fixturePool.token).mint(ALICE, amountLD);

        // Alice ride bus from pool to oft with native drop
        rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD, BOB, true);

        // DRIVER ride and drive the bus
        driveBusAndRelay(DRIVER, fixturePool.eid, fixtureOFT.eid);

        // check balance on source pool and destination pool
        assertEq(PoolToken(fixturePool.token).balanceOf(ALICE), 0);
        assertEq(PoolToken(fixtureOFT.token).balanceOf(BOB), amountLD);
        assertGt(BOB.balance, 0);
    }

    function test_MultiAsset_Bus_Ride_And_Drive(uint64 _amountSD) public {
        uint256 amountLD = _safeSD2LD(_amountSD);

        uint16 assetUSDT = 1;
        uint16 assetETH = 2;
        uint32 eidEthereum = 1;
        uint32 eidBinance = 4;
        StargateFixture memory fixturePoolUSDT = stargateFixtures[eidEthereum][assetUSDT];
        StargateFixture memory fixturePoolETH = stargateFixtures[eidEthereum][assetETH];
        StargateFixture memory fixtureOFTUSDT = stargateFixtures[eidBinance][assetUSDT];
        StargateFixture memory fixtureOFTETH = stargateFixtures[eidBinance][assetETH];
        // mint tokens to alice
        PoolToken(fixturePoolUSDT.token).mint(ALICE, amountLD);
        PoolToken(fixturePoolETH.token).mint(ALICE, amountLD);
        PoolToken(fixturePoolUSDT.token).mint(BOB, amountLD);
        PoolToken(fixturePoolETH.token).mint(BOB, amountLD);

        // ride bus from ethereum to binance of both assets
        rideBus(ALICE, fixturePoolUSDT.stargate, eidEthereum, eidBinance, amountLD);
        rideBus(ALICE, fixturePoolETH.stargate, eidEthereum, eidBinance, amountLD);
        rideBus(BOB, fixturePoolUSDT.stargate, eidEthereum, eidBinance, amountLD);
        rideBus(BOB, fixturePoolETH.stargate, eidEthereum, eidBinance, amountLD);

        // drive bus
        driveBusAndRelay(DRIVER, eidEthereum, eidBinance);

        // check alice's balance on source pool and destination pool
        assertEq(PoolToken(fixturePoolUSDT.token).balanceOf(ALICE), 0);
        assertEq(PoolToken(fixtureOFTUSDT.token).balanceOf(ALICE), amountLD);
        assertEq(PoolToken(fixturePoolETH.token).balanceOf(ALICE), 0);
        assertEq(PoolToken(fixtureOFTETH.token).balanceOf(ALICE), amountLD);
        // check bob's balance on source pool and destination pool
        assertEq(PoolToken(fixturePoolUSDT.token).balanceOf(BOB), 0);
        assertEq(PoolToken(fixtureOFTUSDT.token).balanceOf(BOB), amountLD);
        assertEq(PoolToken(fixturePoolETH.token).balanceOf(BOB), 0);
        assertEq(PoolToken(fixtureOFTETH.token).balanceOf(BOB), amountLD);
    }

    function test_SingleAsset_Drive_Bus_full(uint64 _amountSD, uint8 _capacity) public {
        // Assume the capacity is between 0 and 200.
        vm.assume(_capacity > 0 && _capacity <= MAX_BUS_CAPACITY);
        vm.assume(_amountSD % _capacity == 0); // _amountSD is divisible by _capacity, making test symmetry easier
        uint256 amountLD = _safeSD2LD(_amountSD); // implicitly, amountLD % _capacity == 0 also

        uint16 assetId = 1;
        StargateFixture memory fixturePool = stargateFixtures[1][assetId];
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId];
        // mint tokens to alice
        PoolToken(fixturePool.token).mint(ALICE, amountLD);

        // ride and drive the max capacity in a single tx
        for (uint8 i = 0; i < _capacity; i++) {
            rideBus(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD / _capacity);
        }

        // drive bus
        driveBusAndRelay(DRIVER, fixturePool.eid, fixtureOFT.eid);

        // check alice's balance on source pool and destination pool
        assertEq(PoolToken(fixturePool.token).balanceOf(ALICE), 0);
        assertEq(PoolToken(fixtureOFT.token).balanceOf(ALICE), amountLD);
    }

    function test_Send_Credit(uint64 _amountSD) public {
        uint256 amountLD = _safeSD2LD(_amountSD);

        uint16 assetETH = 1;
        uint16 assetUSDT = 2;
        uint32 eidEthereum = 1;
        uint32 eidBinance = 2;
        uint32 eidPolygon = 4;
        StargateFixture memory fixturePoolEthereumETH = stargateFixtures[eidEthereum][assetETH];
        StargateFixture memory fixturePoolEthereumUSDT = stargateFixtures[eidEthereum][assetUSDT];
        StargateFixture memory fixturePoolBinanceETH = stargateFixtures[eidBinance][assetETH];
        StargateFixture memory fixturePoolBinanceUSDT = stargateFixtures[eidBinance][assetUSDT];
        StargateFixture memory fixtureOFTPolygonETH = stargateFixtures[eidPolygon][assetETH];
        StargateFixture memory fixtureOFTPolygonUSDT = stargateFixtures[eidPolygon][assetUSDT];
        // mint add add liquidity
        mintAndAddLiquidity(ALICE, fixturePoolEthereumETH.stargate, amountLD);
        mintAndAddLiquidity(ALICE, fixturePoolEthereumUSDT.stargate, amountLD);
        mintAndAddLiquidity(ALICE, fixturePoolBinanceETH.stargate, amountLD);
        mintAndAddLiquidity(ALICE, fixturePoolBinanceUSDT.stargate, amountLD);

        // assert credit(local) of each chain
        assertEq(_getCredit(fixturePoolEthereumETH.stargate, eidEthereum), _amountSD);
        assertEq(_getCredit(fixturePoolEthereumUSDT.stargate, eidEthereum), _amountSD);
        assertEq(_getCredit(fixturePoolBinanceETH.stargate, eidBinance), _amountSD);
        assertEq(_getCredit(fixturePoolBinanceUSDT.stargate, eidBinance), _amountSD);

        // 1. send credit(local) from ethereum to binance of both assets
        TargetCreditBatch[] memory creditBatches = new TargetCreditBatch[](2);
        creditBatches[0] = TargetCreditBatch({ assetId: assetETH, credits: new TargetCredit[](1) });
        creditBatches[0].credits[0] = TargetCredit({ srcEid: eidEthereum, amount: _amountSD, minAmount: 0 }); // send ethereum eth credit to binance
        creditBatches[1] = TargetCreditBatch({ assetId: assetUSDT, credits: new TargetCredit[](1) });
        creditBatches[1].credits[0] = TargetCredit({ srcEid: eidEthereum, amount: _amountSD, minAmount: 0 }); // send ethereum usdt credit to binance
        sendCreditAndRelay(address(creditMessagingByEid[eidEthereum]), eidBinance, creditBatches);

        // assert credit of binance from ethereum
        assertEq(_getCredit(fixturePoolBinanceETH.stargate, eidEthereum), _amountSD);
        assertEq(_getCredit(fixturePoolBinanceUSDT.stargate, eidEthereum), _amountSD);
        // assert local credit
        assertEq(_getCredit(fixturePoolEthereumETH.stargate, eidEthereum), 0);
        assertEq(_getCredit(fixturePoolEthereumUSDT.stargate, eidEthereum), 0);
        assertEq(_getCredit(fixturePoolBinanceETH.stargate, eidBinance), _amountSD);
        assertEq(_getCredit(fixturePoolBinanceUSDT.stargate, eidBinance), _amountSD);

        // 2. send credit from binance to polygon of both assets
        creditBatches[0] = TargetCreditBatch({ assetId: assetETH, credits: new TargetCredit[](2) });
        creditBatches[0].credits[0] = TargetCredit({ srcEid: eidEthereum, amount: _amountSD, minAmount: 0 }); // send ethereum eth credit to polygon
        creditBatches[0].credits[1] = TargetCredit({ srcEid: eidBinance, amount: _amountSD, minAmount: 0 }); // send binance(local) eth credit to polygon
        creditBatches[1] = TargetCreditBatch({ assetId: assetUSDT, credits: new TargetCredit[](2) });
        creditBatches[1].credits[0] = TargetCredit({ srcEid: eidEthereum, amount: _amountSD, minAmount: 0 }); // send ethereum usdt credit to polygon
        creditBatches[1].credits[1] = TargetCredit({ srcEid: eidBinance, amount: _amountSD, minAmount: 0 }); // send binance(local) usdt credit to polygon
        sendCreditAndRelay(address(creditMessagingByEid[eidBinance]), eidPolygon, creditBatches);

        // assert credit of polygon from binance
        assertEq(_getCredit(fixtureOFTPolygonETH.stargate, eidBinance), _amountSD);
        assertEq(_getCredit(fixtureOFTPolygonETH.stargate, eidEthereum), _amountSD);
        assertEq(_getCredit(fixtureOFTPolygonUSDT.stargate, eidBinance), _amountSD);
        assertEq(_getCredit(fixtureOFTPolygonUSDT.stargate, eidEthereum), _amountSD);
        // assert local credit
        assertEq(_getCredit(fixturePoolEthereumETH.stargate, eidEthereum), 0);
        assertEq(_getCredit(fixturePoolEthereumUSDT.stargate, eidEthereum), 0);
        assertEq(_getCredit(fixturePoolBinanceETH.stargate, eidBinance), 0);
        assertEq(_getCredit(fixturePoolBinanceUSDT.stargate, eidBinance), 0);
    }

    function test_RedeemSend(uint64 _amountSD) public {
        uint256 amountLD = _safeSD2LD(_amountSD);
        uint16 assetId = 1;
        StargateFixture memory fixturePool = stargateFixtures[1][assetId];
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId];
        // deposit to pool
        mintAndAddLiquidity(ALICE, fixturePool.stargate, amountLD);

        address lpToken = StargatePool(fixturePool.stargate).lpToken();

        uint256 beforeBalance = PoolToken(fixtureOFT.token).balanceOf(ALICE);
        uint256 lpTokenBalance = PoolToken(lpToken).balanceOf(ALICE);
        assertEq(lpTokenBalance, amountLD);

        redeemSendAndRelay(ALICE, fixturePool.stargate, fixturePool.eid, fixtureOFT.eid, amountLD);

        assertEq(PoolToken(fixtureOFT.token).balanceOf(ALICE), beforeBalance + amountLD);
        assertEq(PoolToken(lpToken).balanceOf(ALICE), 0);
    }

    function test_sendToken_fareResolution(uint64 _amountSD, uint8 _nativeFeeDelta) public {
        // 1. Test assumptions and setup
        uint256 amountLD = sdToLd(_amountSD);
        vm.assume(_amountSD > 0 && amountLD < type(uint64).max); // Assume: non-zero amountSD and avoid Path_UnlimitedCredit.
        vm.assume(_nativeFeeDelta > 0); // Assume: non-zero nativeFeeDelta so the negative tests can be executed.

        uint16 assetId = 1;
        StargateFixture memory fixturePool = stargateFixtures[1][assetId];
        StargateFixture memory fixtureOFT = stargateFixtures[4][assetId];
        mintAndAddLiquidity(ALICE, fixturePool.stargate, amountLD);
        address refundAddress = makeAddr("refundAddress");

        // 2. sendToken(...) including not enough nativeFee, expect revert with Stargate_InsufficientFare.
        SendParam memory sendParam = createRideBusSendParams(fixtureOFT, ALICE, amountLD);
        MessagingFee memory messagingFee = StargateBase(fixturePool.stargate).quoteSend(sendParam, false);
        vm.assume(_nativeFeeDelta <= messagingFee.nativeFee); // avoid underflow
        messagingFee.nativeFee -= _nativeFeeDelta;
        vm.prank(ALICE);
        PoolToken(StargateBase(fixturePool.stargate).token()).approve(fixturePool.stargate, amountLD);
        PoolToken(StargateBase(fixturePool.stargate).token()).mint(ALICE, amountLD);
        send(
            ALICE,
            fixturePool.stargate,
            sendParam,
            messagingFee,
            refundAddress,
            StargateBase.Stargate_InsufficientFare.selector
        );
        assertEq(0, refundAddress.balance);

        // 3. sendToken(...) with correct nativeFee, expect success.
        messagingFee = StargateBase(fixturePool.stargate).quoteSend(sendParam, false);
        vm.prank(ALICE);
        PoolToken(StargateBase(fixturePool.stargate).token()).approve(fixturePool.stargate, amountLD);
        PoolToken(StargateBase(fixturePool.stargate).token()).mint(ALICE, amountLD);
        send(ALICE, fixturePool.stargate, sendParam, messagingFee, refundAddress);
        assertEq(0, refundAddress.balance);

        // 4. sendToken(...) including too much nativeFee, expect refund.
        messagingFee = StargateBase(fixturePool.stargate).quoteSend(sendParam, false);
        messagingFee.nativeFee += _nativeFeeDelta;
        uint256 aliceBalanceBefore = ALICE.balance;
        vm.prank(BOB); // further proves point that msg.sender does not matter for send(...) purposes
        PoolToken(StargateBase(fixturePool.stargate).token()).approve(fixturePool.stargate, amountLD);
        send(ALICE, fixturePool.stargate, sendParam, messagingFee);
        assertEq(_nativeFeeDelta + aliceBalanceBefore, ALICE.balance);
    }

    /// @dev Helper function to create commonly used SendParam for riding the bus.
    function createRideBusSendParams(
        StargateFixture memory _fixtureOFT,
        address _sender,
        uint256 _amountLD
    ) internal pure returns (SendParam memory) {
        return
            SendParam(
                _fixtureOFT.eid,
                addressToBytes32(_sender),
                _amountLD,
                (900 * _amountLD) / 1000,
                "",
                "",
                OftCmdHelper.bus()
            );
    }
}

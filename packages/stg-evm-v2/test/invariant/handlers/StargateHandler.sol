// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test, StdUtils, console } from "forge-std/Test.sol";

import { PoolToken } from "../../../src/mocks/PoolToken.sol";
import { TargetCredit, TargetCreditBatch } from "../../../src/interfaces/ICreditMessaging.sol";
import { LPToken } from "../../../src/utils/LPToken.sol";
import { StargateFixture, StargateTestHelper, StargateBase, StargatePool, StargateType, TokenMessaging } from "../../StargateTestHelper.sol";
import { BaseHandler } from "./BaseHandler.sol";
import { TestConfig } from "../TestConfig.sol";

contract UnboundStargateHandler is BaseHandler, StargateTestHelper, StdUtils {
    uint64 internal constant UNLIMITED_CREDIT = type(uint64).max;
    uint24 internal constant MAX_FEE_MILLIONTH = 10_000; // 1%
    uint24 internal constant MAX_REWARD_MILLIONTH = 10_000; // 1%

    uint256 public immutable CHAIN_BOUND;

    uint8 public immutable ASSET_NUM;
    uint8 public immutable POOL_NUM;
    uint8 public immutable NATIVE_POOL_NUM;
    uint8 public immutable OFT_NUM;

    // temp cache for testing
    TargetCredit[] internal creditsCache;

    constructor(uint8 _assetNum, uint8 _poolNum, uint8 _nativePoolNum, uint8 _oftNum) {
        CHAIN_BOUND = _poolNum + _nativePoolNum + _oftNum;
        ASSET_NUM = _assetNum;
        POOL_NUM = _poolNum;
        NATIVE_POOL_NUM = _nativePoolNum;
        OFT_NUM = _oftNum;
        VM.deal(address(this), type(uint256).max);
        setUpStargate(_assetNum, _poolNum, _nativePoolNum, _oftNum, true);
    }

    // --- fuzzing functions ---

    function donate(uint32 _eid, uint16 _assetId, uint256 _amount) public virtual unboundedCall("donate") {
        donate(_safeGetStargateFixture(_eid, _assetId), _amount);
    }

    function recover(uint32 _eid, uint16 _assetId, uint256 _amount) public virtual unboundedCall("recover") {
        recover(_safeGetStargateFixture(_eid, _assetId), _amount);
    }

    function deposit(
        address _user,
        uint32 _eid,
        uint16 _assetId,
        uint256 _amount
    ) public virtual unboundedCall("deposit") {
        mintAndAddLiquidity(_user, _safeGetStargateFixture(_eid, _assetId), _amount);
    }

    function redeem(
        address _user,
        uint32 _eid,
        uint16 _assetId,
        uint256 _amount
    ) public virtual unboundedCall("redeem") {
        redeem(_user, _safeGetStargateFixture(_eid, _assetId), _amount);
    }

    function redeemSend(
        address _user,
        uint32 _fromEid,
        uint32 _toEid,
        uint16 _assetId,
        uint256 _amount,
        address _toUser
    ) public virtual unboundedCall("redeemSend") {
        redeemSendAndRelay(_user, _safeGetStargateFixture(_fromEid, _assetId), _fromEid, _toEid, _amount, _toUser);
    }

    function rebalance(uint32 _poolEid, uint256 _weightSeed) public virtual unboundedCall("rebalance") {
        // withdraw all credits from remote stargate
        for (uint32 i = 0; i < CHAIN_BOUND; i++) {
            uint32 remoteEid = i + 1;
            if (remoteEid == _poolEid) continue;

            TargetCreditBatch[] memory creditBatches = new TargetCreditBatch[](ASSET_NUM);
            for (uint16 j = 0; j < ASSET_NUM; j++) {
                uint16 assetId = j + 1;
                uint64 credit = _getCredit(_safeGetStargateFixture(remoteEid, assetId), _poolEid);
                require(credit != UNLIMITED_CREDIT, "credit is unlimited");
                TargetCredit[] memory credits = new TargetCredit[](1);
                credits[0] = TargetCredit(_poolEid, credit, 0);
                creditBatches[j] = TargetCreditBatch(assetId, credits);
            }
            sendCreditAndRelay(address(creditMessagingByEid[remoteEid]), _poolEid, creditBatches);
        }

        // get total credits locally and calculate weights (assetId => eid => weight)
        uint64[] memory totalCreditsByAssets = new uint64[](ASSET_NUM);
        uint256[][] memory weightsByAssets = new uint256[][](ASSET_NUM);
        uint256[] memory totalWeightByAssets = new uint256[](ASSET_NUM);
        for (uint16 i = 0; i < ASSET_NUM; i++) {
            uint16 assetId = i + 1;
            uint256 totalWeight = 0;
            uint256[] memory weights = new uint256[](CHAIN_BOUND);
            for (uint32 j = 0; j < CHAIN_BOUND; j++) {
                uint32 eid = j + 1;
                uint256 weight = uint128(uint256(keccak256(abi.encodePacked(_weightSeed, assetId, eid))));
                weights[j] = weight;
                totalWeight += weight;
            }
            weightsByAssets[i] = weights;
            totalWeightByAssets[i] = totalWeight;

            totalCreditsByAssets[i] = _getCredit(_safeGetStargateFixture(_poolEid, assetId), _poolEid);
        }

        // rebalance
        for (uint32 i = 0; i < CHAIN_BOUND; i++) {
            uint32 remoteEid = i + 1;
            if (remoteEid == _poolEid) continue;

            TargetCreditBatch[] memory creditBatches = new TargetCreditBatch[](ASSET_NUM);
            for (uint16 j = 0; j < ASSET_NUM; j++) {
                uint16 assetId = j + 1;
                uint64 targetCredit = uint64(
                    (totalCreditsByAssets[j] * weightsByAssets[j][i]) / totalWeightByAssets[j]
                );
                TargetCredit[] memory credits = new TargetCredit[](1);
                credits[0] = TargetCredit(_poolEid, targetCredit, 0);
                creditBatches[j] = TargetCreditBatch(assetId, credits);
            }
            sendCreditAndRelay(address(creditMessagingByEid[_poolEid]), remoteEid, creditBatches);
        }
    }

    function sendCredit(
        uint32 _fromEid,
        uint32 _toEid,
        uint256 _assetRandom, // random number to select asset, each 2 digit represent a assetId, example: 123456, 12, 34, 56 are assetId
        uint64 _amount,
        uint64 _minAmount
    ) public virtual unboundedCall("sendCredit") {
        TargetCreditBatch[] memory creditBatchesCache = new TargetCreditBatch[](ASSET_NUM);
        uint256 batchCursor = 0;

        for (uint16 currentAssetCount = 0; currentAssetCount < ASSET_NUM; currentAssetCount++) {
            if (_assetRandom == 0) break;

            uint16 assetId = uint16((_assetRandom / (10 ** (currentAssetCount * 2))) % 100);
            assetId = boundAssetId(assetId);
            if (assetId == 0) continue;

            // if exists, skip
            bool exists = false;
            for (uint256 i = 0; i < creditBatchesCache.length; i++) {
                if (creditBatchesCache[i].assetId == assetId) {
                    exists = true;
                    continue;
                }
            }
            if (exists) continue;

            // send credits by asset
            delete creditsCache; // clear cache
            for (uint32 i = 0; i < CHAIN_BOUND; i++) {
                uint32 srcEid = i + 1;
                uint64 credit = _getCredit(_safeGetStargateFixture(_fromEid, assetId), srcEid);
                if (credit != 0 && credit != UNLIMITED_CREDIT) {
                    uint64 creditAmount = uint64(bound(_amount, 1, credit));
                    uint64 minCreditAmount = uint64(bound(_minAmount, 0, (credit * 15) / 10)); // max 1.5x credit
                    creditsCache.push(TargetCredit(srcEid, creditAmount, minCreditAmount));
                }
            }
            if (creditsCache.length > 0) {
                creditBatchesCache[batchCursor] = TargetCreditBatch(assetId, creditsCache);
                batchCursor++;
            }

            _assetRandom = _assetRandom / (10 ** (currentAssetCount * 2));
        }

        if (batchCursor > 0) {
            // resize batch
            assembly {
                mstore(creditBatchesCache, batchCursor)
            }
            sendCreditAndRelay(address(creditMessagingByEid[_fromEid]), _toEid, creditBatchesCache);
        }
    }

    function taxi(
        uint32 _fromEid,
        address _fromUser,
        uint32 _toEid,
        address _toUser,
        uint16 _assetId,
        uint256 _amount,
        uint128 _nativeDrop
    ) public virtual unboundedCall("taxi") {
        sendTaxiAndRelay(
            _fromUser,
            _safeGetStargateFixture(_fromEid, _assetId),
            _toEid,
            _amount,
            _toUser,
            "",
            _nativeDrop
        );
    }

    function rideBus(
        uint32 _fromEid,
        address _fromUser,
        uint32 _toEid,
        address _toUser,
        uint16 _assetId,
        uint256 _amount,
        bool nativeDrop
    ) public virtual unboundedCall("rideBus") {
        rideBus(_fromUser, _safeGetStargateFixture(_fromEid, _assetId), _fromEid, _toEid, _amount, _toUser, nativeDrop);
    }

    function driveBus(address _driver, uint32 _fromEid, uint32 _toEid) public virtual unboundedCall("driveBus") {
        driveBusAndRelay(_driver, _fromEid, _toEid);
    }

    function setFeeConfig(
        uint16 _assetId,
        uint32 _srcEid,
        uint24 _feeMillionth,
        uint24 _rewardMillionth
    ) public virtual unboundedCall("setFeeConfig") {
        for (uint32 i = 0; i < CHAIN_BOUND; i++) {
            uint32 dstEid = i + 1;
            setFeeConfig(_assetId, _srcEid, dstEid, _feeMillionth, _rewardMillionth);
        }
    }

    function addTreasuryFee(
        uint16 _assetId,
        uint32 _eid,
        uint64 _amountSD
    ) public virtual unboundedCall("addTreasuryFee") {
        uint256 amountLD = sdToLd(_amountSD);
        addTreasuryFee(_safeGetStargateFixture(_eid, _assetId), amountLD);
    }

    function withdrawTreasuryFee(
        uint16 _assetId,
        uint32 _eid,
        address _to,
        uint64 _amountSD
    ) public virtual unboundedCall("withdrawTreasuryFee") {
        withdrawTreasuryFee(_safeGetStargateFixture(_eid, _assetId), _to, _amountSD);
    }

    function withdrawPlannerFee(uint16 _assetId, uint32 _eid) public virtual unboundedCall("withdrawPlannerFee") {
        withdrawPlannerFee(_safeGetStargateFixture(_eid, _assetId));
    }

    // --- helper functions ---
    function bound(uint256 _x, uint256 _min, uint256 _max) internal pure override returns (uint256 result) {
        return _bound(_x, _min, _max);
    }

    function boundAssetId(uint16 _assetId) internal view returns (uint16) {
        return uint16(bound(_assetId, 1, ASSET_NUM));
    }

    // ------------------ view functions ------------------

    function getGlobalOftSupply(uint16 _assetId) public view returns (uint256) {
        uint256 sum = 0;
        for (uint32 i = POOL_NUM + NATIVE_POOL_NUM; i < CHAIN_BOUND; i++) {
            uint32 eid = i + 1;
            sum += PoolToken(stargateFixtures[eid][_assetId].token).totalSupply();
            sum += sdToLd(StargateBase(stargateFixtures[eid][_assetId].stargate).treasuryFee());
        }
        return sum;
    }

    function getGlobalTvl(uint16 _assetId) public view returns (uint256) {
        uint256 sum = 0;
        for (uint32 i = 0; i < POOL_NUM + NATIVE_POOL_NUM; i++) {
            uint32 eid = i + 1;
            sum += StargatePool(stargateFixtures[eid][_assetId].stargate).tvl();
        }
        return sum;
    }

    function getPoolTvl(uint32 _eid, uint16 _assetId) public view returns (uint256) {
        return StargatePool(stargateFixtures[_eid][_assetId].stargate).tvl();
    }

    function getPoolLpTokenSupply(uint32 _eid, uint16 _assetId) public view returns (uint256) {
        return LPToken(stargateFixtures[_eid][_assetId].lp).totalSupply();
    }

    function getGlobalPoolBalance(uint16 _assetId) public view returns (uint256 allPoolBalance) {
        for (uint32 i = 0; i < POOL_NUM + NATIVE_POOL_NUM; i++) {
            uint32 poolEid = i + 1;
            allPoolBalance += getPoolBalance(poolEid, _assetId);
        }
    }

    function getPoolBalance(uint32 _eid, uint16 _assetId) public view returns (uint256 balance) {
        address sg = stargateFixtures[_eid][_assetId].stargate;
        balance = StargatePool(sg).poolBalance();
    }

    function getTreasuryFee(uint32 _eid, uint16 _assetId) public view returns (uint256) {
        address sg = stargateFixtures[_eid][_assetId].stargate;
        return sdToLd(StargateBase(sg).treasuryFee());
    }

    function getNativeBalance(uint32 _eid, uint16 _assetId) public view returns (uint256 balance) {
        address sg = stargateFixtures[_eid][_assetId].stargate;
        balance = sg.balance;
    }

    function getPlannerFee(uint32 _eid, uint16 _assetId) public view returns (uint256) {
        address sg = stargateFixtures[_eid][_assetId].stargate;
        return StargateBase(sg).plannerFee();
    }

    function getTotalCredits(uint32 _srcEid, uint16 _assetId) public view returns (uint256 credits) {
        for (uint32 i = 0; i < CHAIN_BOUND; i++) {
            uint32 remoteEid = i + 1;
            uint64 credit = _getCredit(_safeGetStargateFixture(remoteEid, _assetId), _srcEid);
            if (credit != UNLIMITED_CREDIT) credits += sdToLd(credit);
        }
    }

    function getGlobalBusSendingAmount(uint16 _assetId) public view returns (uint256 totalAmount) {
        for (uint32 i = 0; i < CHAIN_BOUND; i++) {
            uint32 eid = i + 1;
            totalAmount += getTotalBusSendingAmount(eid, _assetId);
        }
    }

    function getTotalBusSendingAmount(uint32 _dstEid, uint16 _assetId) public view returns (uint256) {
        uint256 sum = 0;
        for (uint8 i = 0; i < tokenMessagingList.length; i++) {
            uint32 eid = i + 1;
            if (eid == _dstEid) continue;

            (, , , uint16 latestTicketOffset, uint72 startTicketId) = tokenMessagingByEid[eid].busQueues(_dstEid);
            uint72 latestTicketId = startTicketId + latestTicketOffset;
            Amount[] memory amountLdCache = passengersAmountLdCache[eid][_dstEid];
            for (uint72 k = startTicketId; k < latestTicketId; k++) {
                if (amountLdCache[k].assetId == _assetId) {
                    uint256 amountLD = amountLdCache[k].amount;
                    sum += amountLD;
                }
            }
        }
        return sum;
    }

    function getGlobalCreditLD() public view returns (uint256 allCreditLD) {
        allCreditLD = 0;
        for (uint32 i = 0; i < stargateFixtureList.length; i++) {
            StargatePool sg = StargatePool(
                _safeGetStargateFixture(stargateFixtureList[i].eid, stargateFixtureList[i].assetId)
            );

            for (uint32 j = 0; j < stargateFixtureList.length; j++) {
                if (stargateFixtureList[j].assetId != stargateFixtureList[i].assetId) continue;
                uint32 toEid = stargateFixtureList[j].eid;
                uint64 credit = sg.paths(toEid);
                if (credit != UNLIMITED_CREDIT) {
                    allCreditLD += sdToLd(credit);
                }
            }
        }
    }

    function printCreditsDistribution() public view {
        for (uint16 i = 0; i < ASSET_NUM; i++) {
            uint16 assetId = i + 1;
            console.log("=============================== assetId: %d ===============================", assetId);
            for (uint32 j = 0; j < POOL_NUM + NATIVE_POOL_NUM; j++) {
                uint32 poolEid = j + 1;
                console.log("poolEid: %d", poolEid);
                for (uint32 k = 0; k < CHAIN_BOUND; k++) {
                    uint32 remoteEid = k + 1;
                    uint64 credit = _getCredit(_safeGetStargateFixture(remoteEid, assetId), poolEid);
                    console.log("remoteEid: %d, credit: %d", remoteEid, credit);
                }
            }
        }
    }
}

contract BoundStargateHandler is UnboundStargateHandler {
    // 8 users, from 0xF0 to 0xF8
    uint256 internal constant USER_BOUND_START = 0xF0;
    uint256 internal constant USER_BOUND_END = 0xF8;

    uint256 internal constant MAX_TOKEN_AMOUNT_SEND = 1_000_000 ether;
    uint256 internal constant MAX_TREASURY_AMOUNT_ADD = 100_000 ether;

    constructor(
        uint8 _assetNum,
        uint8 _poolNum,
        uint8 _nativePoolNum,
        uint8 _oftNum
    ) UnboundStargateHandler(_assetNum, _poolNum, _nativePoolNum, _oftNum) {}

    // --- fuzzing functions ---

    function donate(uint32 _eid, uint16 _assetId, uint256 _amount) public override boundedCall("donate") {
        _eid = boundPoolEid(_eid);
        _assetId = boundAssetId(_assetId);
        _amount = boundAmount(_amount);
        if (_amount == 0) return;

        super.donate(_eid, _assetId, _amount);
    }

    function recover(uint32 _eid, uint16 _assetId, uint256 _amount) public override boundedCall("recover") {
        _eid = boundPoolEid(_eid);
        _assetId = boundAssetId(_assetId);
        _amount = boundAmount(_amount);
        if (_amount == 0) return;

        super.recover(_eid, _assetId, _amount);
    }

    function deposit(
        address _user,
        uint32 _eid,
        uint16 _assetId,
        uint256 _amount
    ) public override boundedCall("deposit") {
        _eid = boundPoolEid(_eid);
        _assetId = boundAssetId(_assetId);
        _user = boundUser(_user);
        _amount = boundAmount(_amount);
        if (_amount < sdToLd(1)) return;
        bool isNativePool = _eid > TestConfig.POOL_NUM &&
            _eid < TestConfig.POOL_NUM + TestConfig.NATIVE_POOL_NUM + TestConfig.OFT_NUM;
        if (isNativePool) {
            // must remove dust for native pool
            uint256 oneSD = sdToLd(1);
            _amount = (_amount / oneSD) * oneSD;
        }
        super.deposit(_user, _eid, _assetId, _amount);
    }

    function redeem(
        address _user,
        uint32 _eid,
        uint16 _assetId,
        uint256 _amount
    ) public override boundedCall("redeem") {
        _eid = boundPoolEid(_eid);
        _assetId = boundAssetId(_assetId);
        _user = boundUser(_user);
        _amount = boundRedeemAmount(_user, _eid, _assetId, _amount);
        if (_amount < sdToLd(1)) return;

        super.redeem(_user, _eid, _assetId, _amount);
    }

    function redeemSend(
        address _user,
        uint32 _fromEid,
        uint32 _toEid,
        uint16 _assetId,
        uint256 _amount,
        address _toUser
    ) public override boundedCall("redeemSend") {
        _fromEid = boundPoolEid(_fromEid);
        _toEid = boundEid(_toEid);
        if (_fromEid == _toEid) {
            _toEid = boundEid(_toEid + 1);
        }
        _assetId = boundAssetId(_assetId);
        _user = boundUser(_user);
        _toUser = boundUser(_toUser);
        address lp = stargateFixtures[_fromEid][_assetId].lp;
        _amount = bound(_amount, 0, LPToken(lp).balanceOf(_user));
        _amount = boundCreditAmountLD(_fromEid, _toEid, _assetId, _amount);
        if (_amount < sdToLd(1)) return;

        super.redeemSend(_user, _fromEid, _toEid, _assetId, _amount, _toUser);
    }

    function rebalance(uint32 _poolEid, uint256 _weightSeed) public override boundedCall("rebalance") {
        _poolEid = boundPoolEid(_poolEid);
        super.rebalance(_poolEid, _weightSeed);
    }

    function sendCredit(
        uint32 _fromEid,
        uint32 _toEid,
        uint256 _assetRandom,
        uint64 _amount,
        uint64 _minAmount
    ) public override boundedCall("sendCredit") {
        (_fromEid, _toEid) = boundEidPair(_fromEid, _toEid);
        super.sendCredit(_fromEid, _toEid, _assetRandom, _amount, _minAmount);
    }

    function taxi(
        uint32 _fromEid,
        address _fromUser,
        uint32 _toEid,
        address _toUser,
        uint16 _assetId,
        uint256 _amount,
        uint128 _nativeDrop
    ) public override boundedCall("taxi") {
        _toUser = boundUser(_toUser);
        _nativeDrop = boundNativeDrop(_nativeDrop);
        (_fromEid, _fromUser, _toEid, _assetId, _amount) = preSend(_fromEid, _fromUser, _toEid, _assetId, _amount);
        if (_amount < sdToLd(1)) return;

        super.taxi(_fromEid, _fromUser, _toEid, _toUser, _assetId, _amount, _nativeDrop);
    }

    function rideBus(
        uint32 _fromEid,
        address _fromUser,
        uint32 _toEid,
        address _toUser,
        uint16 _assetId,
        uint256 _amount,
        bool nativeDrop
    ) public override boundedCall("rideBus") {
        _toUser = boundUser(_toUser);
        (_fromEid, _fromUser, _toEid, _assetId, _amount) = preSend(_fromEid, _fromUser, _toEid, _assetId, _amount);
        if (_amount < sdToLd(1)) return;

        bool isFull = _isBusFull(_fromEid, _toEid);
        if (isFull) return;

        super.rideBus(_fromEid, _fromUser, _toEid, _toUser, _assetId, _amount, nativeDrop);
    }

    function driveBus(address _driver, uint32 _fromEid, uint32 _toEid) public override boundedCall("driveBus") {
        _driver = boundUser(_driver);
        (_fromEid, _toEid) = boundEidPair(_fromEid, _toEid);
        super.driveBus(_driver, _fromEid, _toEid);
    }

    function setFeeConfig(
        uint16 _assetId,
        uint32 _srcEid,
        uint24 _feeMillionth,
        uint24 _rewardMillionth
    ) public override boundedCall("setFeeConfig") {
        _srcEid = boundEid(_srcEid);
        _assetId = boundAssetId(_assetId);
        _feeMillionth = boundFeeMillionth(_feeMillionth);
        _rewardMillionth = boundRewardMillionth(_rewardMillionth);
        super.setFeeConfig(_assetId, _srcEid, _feeMillionth, _rewardMillionth);
    }

    function addTreasuryFee(
        uint16 _assetId,
        uint32 _eid,
        uint64 _amountSD
    ) public override boundedCall("addTreasuryFee") {
        _eid = boundEid(_eid);
        _assetId = boundAssetId(_assetId);
        _amountSD = boundTreasuryAmountSD(_eid, _assetId, _amountSD, false);
        super.addTreasuryFee(_assetId, _eid, _amountSD);
    }

    function withdrawTreasuryFee(
        uint16 _assetId,
        uint32 _eid,
        address _to,
        uint64 _amountSD
    ) public override boundedCall("withdrawTreasuryFee") {
        _to = boundUser(_to);
        _eid = boundEid(_eid);
        _assetId = boundAssetId(_assetId);
        _amountSD = boundTreasuryAmountSD(_eid, _assetId, _amountSD, true);
        if (_amountSD == 0) return;
        super.withdrawTreasuryFee(_assetId, _eid, _to, _amountSD);
    }

    function withdrawPlannerFee(uint16 _assetId, uint32 _eid) public override boundedCall("withdrawPlannerFee") {
        _eid = boundEid(_eid);
        _assetId = boundAssetId(_assetId);
        super.withdrawPlannerFee(_assetId, _eid);
    }

    // --- helper functions ---

    function preSend(
        uint32 _fromEid,
        address _fromUser,
        uint32 _toEid,
        uint16 _assetId,
        uint256 _amount
    ) internal returns (uint32 fromEid, address fromUser, uint32 toEid, uint16 assetId, uint256 amount) {
        (fromEid, toEid) = boundEidPair(_fromEid, _toEid);
        fromUser = boundUser(_fromUser);
        assetId = boundAssetId(_assetId);

        /// bound send amount
        amount = bound(_amount, 0, MAX_TOKEN_AMOUNT_SEND);

        // amount should be less than credit amount
        amount = boundCreditAmountLD(fromEid, toEid, assetId, amount);

        // bound user balance
        if (stargateFixtures[fromEid][assetId].token != address(0)) {
            uint256 userBalance = PoolToken(stargateFixtures[fromEid][assetId].token).balanceOf(fromUser);
            StargateType stargateType = stargateFixtures[fromEid][assetId].stargateType;
            if (stargateType == StargateType.OFT) {
                // amount should be less than user balance
                amount = amount > userBalance ? userBalance : amount;
            } else {
                // mint if user don't have enough token
                uint256 mintAmount = amount > userBalance ? amount - userBalance : 0;
                if (mintAmount > 0) {
                    PoolToken(stargateFixtures[fromEid][assetId].token).mint(fromUser, mintAmount);
                }
            }
        }
    }

    function boundPoolEid(uint32 _eid) internal view returns (uint32) {
        return uint32(bound(_eid, 1, POOL_NUM + NATIVE_POOL_NUM));
    }

    function boundEidPair(uint32 _fromEid, uint32 _toEid) internal view returns (uint32 fromEid, uint32 toEid) {
        fromEid = boundEid(_fromEid);
        toEid = boundEid(_toEid);
        if (fromEid == toEid) {
            toEid = boundEid(toEid + 1);
        }
    }

    function boundUser(address _user) internal pure returns (address) {
        uint160 userN = uint160(_user);
        uint160 boundUserN = uint160(bound(uint(userN), USER_BOUND_START, USER_BOUND_END));
        return address(boundUserN);
    }

    function boundEid(uint32 _chainId) internal view returns (uint32) {
        return uint32(bound(_chainId, 1, CHAIN_BOUND));
    }

    function boundAmount(uint256 _amount) internal pure returns (uint256) {
        _amount = bound(_amount, 0, MAX_TOKEN_AMOUNT_SEND);
        return _amount;
    }

    function boundFeeMillionth(uint24 _feeMillionth) internal pure returns (uint24) {
        return uint24(bound(_feeMillionth, 0, MAX_FEE_MILLIONTH));
    }

    function boundRewardMillionth(uint24 _rewardMillionth) internal pure returns (uint24) {
        return uint24(bound(_rewardMillionth, 0, MAX_REWARD_MILLIONTH));
    }

    function boundRedeemAmount(
        address _sender,
        uint32 _eid,
        uint16 _assetId,
        uint256 _amount
    ) internal view returns (uint256) {
        address stargateAddr = _safeGetStargateFixture(_eid, _assetId);
        StargatePool sg = StargatePool(stargateAddr);
        uint256 maxAmount = sg.redeemable(_sender);
        _amount = bound(_amount, 0, maxAmount);
        return _amount;
    }

    function boundCreditAmountLD(
        uint32 _fromEid,
        uint32 _toEid,
        uint16 _assetId,
        uint256 _amountLD
    ) internal view returns (uint256) {
        address sg = _safeGetStargateFixture(_fromEid, _assetId);
        uint64 credit = StargateBase(sg).paths(_toEid);
        return bound(_amountLD, 0, sdToLd(credit));
    }

    function boundTreasuryAmountSD(
        uint32 _eid,
        uint16 _assetId,
        uint64 _amountSD,
        bool isWithdraw
    ) internal view returns (uint64) {
        if (isWithdraw) {
            address sg = _safeGetStargateFixture(_eid, _assetId);
            uint64 treasuryFee = StargateBase(sg).treasuryFee();
            return uint64(bound(_amountSD, 0, treasuryFee));
        } else {
            return uint64(bound(_amountSD, 1, ldToSd(MAX_TREASURY_AMOUNT_ADD)));
        }
    }

    function boundNativeDrop(uint128 _nativeDrop) internal pure returns (uint128) {
        return uint128(bound(_nativeDrop, 0, NATIVE_DROP_AMOUNT));
    }
}

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import { StargateTestHelper } from "../../StargateTestHelper.sol";

import { FeeParams } from "../../../src/interfaces/IStargateFeeLib.sol";
import { FeeConfig, FeeLibV1 } from "../../../src/feelibs/FeeLibV1.sol";

contract FeeLibV1Test is Test, StargateTestHelper {
    uint256 internal constant FEE_DENOMINATOR = 1_000_000; // must match FeeLibV1.FEE_DENOMINATOR

    FeeLibV1 internal feeLib;

    function setUp() public {
        setUpStargate(1, 1, 0, 0);
        setFeeConfig(1, 1, 1, 0, 0);
        feeLib = stargateFixtures[1][1].feeLib;
    }

    function feeConfigsAreEqual(
        FeeConfig memory expectedFeeConfig,
        FeeConfig memory actualFeeConfig
    ) internal pure returns (bool) {
        return (expectedFeeConfig.paused == actualFeeConfig.paused &&
            expectedFeeConfig.zone1UpperBound == actualFeeConfig.zone1UpperBound &&
            expectedFeeConfig.zone2UpperBound == actualFeeConfig.zone2UpperBound &&
            expectedFeeConfig.zone1FeeMillionth == actualFeeConfig.zone1FeeMillionth &&
            expectedFeeConfig.zone2FeeMillionth == actualFeeConfig.zone2FeeMillionth &&
            expectedFeeConfig.zone3FeeMillionth == actualFeeConfig.zone3FeeMillionth &&
            expectedFeeConfig.rewardMillionth == actualFeeConfig.rewardMillionth);
    }

    function assumeValidFeeConfiguration(
        uint64 _zone1UpperBound,
        uint64 _zone2UpperBound,
        uint24 _zone1FeeMillionth,
        uint24 _zone2FeeMillionth,
        uint24 _zone3FeeMillionth,
        uint24 _rewardMillionth
    ) internal pure {
        vm.assume(_zone1FeeMillionth <= FEE_DENOMINATOR);
        vm.assume(_zone2FeeMillionth <= FEE_DENOMINATOR);
        vm.assume(_zone3FeeMillionth <= FEE_DENOMINATOR);
        vm.assume(_rewardMillionth <= FEE_DENOMINATOR);
        vm.assume(_zone2UpperBound >= _zone1UpperBound);
    }

    function test_getAndSetFeeConfig(uint32 dstEid) public {
        // 1. ensure fee config is empty
        (
            bool paused,
            uint64 zone1UpperBound,
            uint64 zone2UpperBound,
            uint24 zone1FeeMillionth,
            uint24 zone2FeeMillionth,
            uint24 zone3FeeMillionth,
            uint24 rewardMillionth
        ) = feeLib.feeConfigs(dstEid);
        assertTrue(
            feeConfigsAreEqual(
                FeeConfig(false, 0, 0, 0, 0, 0, 0),
                FeeConfig(
                    paused,
                    zone1UpperBound,
                    zone2UpperBound,
                    zone1FeeMillionth,
                    zone2FeeMillionth,
                    zone3FeeMillionth,
                    rewardMillionth
                )
            )
        );

        // 2. just set pause, no other values
        vm.expectEmit();
        emit FeeLibV1.PausedSet(dstEid, true);
        feeLib.setPaused(dstEid, true);
        (
            paused,
            zone1UpperBound,
            zone2UpperBound,
            zone1FeeMillionth,
            zone2FeeMillionth,
            zone3FeeMillionth,
            rewardMillionth
        ) = feeLib.feeConfigs(dstEid);
        assertTrue(
            feeConfigsAreEqual(
                FeeConfig(true, 0, 0, 0, 0, 0, 0),
                FeeConfig(
                    paused,
                    zone1UpperBound,
                    zone2UpperBound,
                    zone1FeeMillionth,
                    zone2FeeMillionth,
                    zone3FeeMillionth,
                    rewardMillionth
                )
            )
        );

        // 3. set other values, but not paused
        vm.expectEmit();
        emit FeeLibV1.FeeConfigSet(dstEid, FeeConfig(true, 1, 2, 3, 4, 5, 6));
        feeLib.setFeeConfig(dstEid, 1, 2, 3, 4, 5, 6);
        (
            paused,
            zone1UpperBound,
            zone2UpperBound,
            zone1FeeMillionth,
            zone2FeeMillionth,
            zone3FeeMillionth,
            rewardMillionth
        ) = feeLib.feeConfigs(dstEid);
        assertTrue(
            feeConfigsAreEqual(
                FeeConfig(true, 1, 2, 3, 4, 5, 6),
                FeeConfig(
                    paused,
                    zone1UpperBound,
                    zone2UpperBound,
                    zone1FeeMillionth,
                    zone2FeeMillionth,
                    zone3FeeMillionth,
                    rewardMillionth
                )
            )
        );

        // 4. unpause
        vm.expectEmit();
        emit FeeLibV1.PausedSet(dstEid, false);
        feeLib.setPaused(dstEid, false);
        (
            paused,
            zone1UpperBound,
            zone2UpperBound,
            zone1FeeMillionth,
            zone2FeeMillionth,
            zone3FeeMillionth,
            rewardMillionth
        ) = feeLib.feeConfigs(dstEid);
        assertTrue(
            feeConfigsAreEqual(
                FeeConfig(false, 1, 2, 3, 4, 5, 6),
                FeeConfig(
                    paused,
                    zone1UpperBound,
                    zone2UpperBound,
                    zone1FeeMillionth,
                    zone2FeeMillionth,
                    zone3FeeMillionth,
                    rewardMillionth
                )
            )
        );
    }

    function test_applyFeeView__noFees_noRewards(uint64 _amountInSD) public {
        // 1. set feeMillionth and rewardMillionth to 0
        setFeeConfig(
            1, // _assetId
            1, // _srcEid
            1, // _dstEid
            0, // _feeMillionth
            0 // _rewardMillionth
        );
        // 2. apply fee
        FeeParams memory params = FeeParams(
            address(this), // sender
            1, // dstEid
            _amountInSD,
            0, // deficitSD
            false, // toOFT
            false // isTaxi
        );
        // 3. fee is 0, so amountInSD should match amountOutSD
        assertEq(_amountInSD, feeLib.applyFeeView(params));
    }

    function test_applyFeeView__noFees_rewardOptional(
        uint64 _amountInSD,
        uint24 _rewardMillionth,
        uint64 _deficitSD,
        bool _toOft,
        bool _isTaxi
    ) public {
        // 1. Assume that:
        // - there is some reward available for the taking (partial or full deficit).
        // - input won't cause over/underflow.  This can happen in real life though.
        vm.assume(_deficitSD > 0 && _rewardMillionth > 0);
        bool isPartial = _amountInSD < _deficitSD;
        uint256 expectedReward = (uint256(isPartial ? _amountInSD : _deficitSD) * _rewardMillionth) / FEE_DENOMINATOR;
        vm.assume(expectedReward + _amountInSD <= type(uint64).max);

        // 2. set fees to 0
        setFeeConfig(
            1, // _assetId
            1, // _srcEid
            1, // _dstEid
            0, // _feeMillionth (disable fees)
            _rewardMillionth // _rewardMillionth
        );

        // 3. apply fee (0) and reward (>=0)
        FeeParams memory params = FeeParams(
            address(this), // sender
            1, // dstEid
            _amountInSD,
            _deficitSD, // deficitSD
            _toOft, // toOFT
            _isTaxi // isTaxi
        );

        // 4. ensure amountOutSD
        uint64 amountOutSD = feeLib.applyFeeView(params);
        assertEq(amountOutSD, _amountInSD + expectedReward);
    }

    function calculateFeeTier(
        uint64 _amountInSd,
        uint64 _zone1UpperBound,
        uint64 _zone2UpperBound,
        uint24 _zone1FeeMillionth,
        uint24 _zone2FeeMillionth,
        uint24 _zone3FeeMillionth
    ) public pure returns (uint24) {
        if (_amountInSd <= _zone1UpperBound) {
            return _zone1FeeMillionth;
        } else if (_amountInSd <= _zone2UpperBound) {
            return _zone2FeeMillionth;
        } else {
            return _zone3FeeMillionth;
        }
    }

    function test_applyFeeView__feesOptional_noReward(
        uint64 _amountInSD,
        uint64 _zone1UpperBound,
        uint64 _zone2UpperBound,
        uint24 _zone1FeeMillionth,
        uint24 _zone2FeeMillionth,
        uint24 _zone3FeeMillionth,
        uint24 _rewardMillionth,
        uint64 _deficitSD,
        bool _toOft,
        bool _isTaxi
    ) public {
        assumeValidFeeConfiguration(
            _zone1UpperBound,
            _zone2UpperBound,
            _zone1FeeMillionth,
            _zone2FeeMillionth,
            _zone3FeeMillionth,
            _rewardMillionth
        );
        // 1. Assume that:
        // - input won't underflow due to fee exceeding _amountInSD.  This can happen in real life though.
        // - output won't overflow uint64.
        // - either the reward rate or the reward deficit is 0 (i.e., the reward is disabled)
        uint24 feeTier = calculateFeeTier(
            _amountInSD,
            _zone1UpperBound,
            _zone2UpperBound,
            _zone1FeeMillionth,
            _zone2FeeMillionth,
            _zone3FeeMillionth
        );
        uint256 expectedFee = feeTier != 0 ? ((uint256(_amountInSD) * feeTier) / FEE_DENOMINATOR + 1) : 0;
        // vm.assume(expectedFee <= type(uint64).max); // implicitly covered by the assumption below...
        vm.assume(expectedFee <= _amountInSD);
        vm.assume(_rewardMillionth == 0 || _deficitSD == 0);

        // 2. set fee configuration
        feeLib.setFeeConfig(
            1, // _dstEid
            _zone1UpperBound,
            _zone2UpperBound,
            _zone1FeeMillionth,
            _zone2FeeMillionth,
            _zone3FeeMillionth,
            _rewardMillionth
        );

        // 3. apply fee (>=0) and reward (0).
        FeeParams memory params = FeeParams(
            address(this), // sender
            1, // dstEid
            _amountInSD,
            _deficitSD, // deficitSD
            _toOft, // toOFT
            _isTaxi // isTaxi
        );

        // 4. ensure amountOutSD is _amountInSD - expectedFee
        assertEq(feeLib.applyFeeView(params), _amountInSD - expectedFee);
    }

    function test_applyFeeView__feesAndRewards(
        uint64 _amountInSD,
        uint64 _zone1UpperBound,
        uint64 _zone2UpperBound,
        uint24 _zone1FeeMillionth,
        uint24 _zone2FeeMillionth,
        uint24 _zone3FeeMillionth,
        uint24 _rewardMillionth,
        uint64 _deficitSD
    ) public {
        assumeValidFeeConfiguration(
            _zone1UpperBound,
            _zone2UpperBound,
            _zone1FeeMillionth,
            _zone2FeeMillionth,
            _zone3FeeMillionth,
            _rewardMillionth
        );
        // 1. Assume that:
        // - input won't underflow due to fee exceeding _amountInSD.  This can happen in real life though.
        // - output won't overflow uint64.
        // - fees and rewards are present for the tx (coerce into applyFeeView(...) else clause).
        vm.assume(_deficitSD > 0 && _rewardMillionth > 0);
        vm.assume(_amountInSD > _deficitSD);

        uint24 feeTier = calculateFeeTier(
            _amountInSD - _deficitSD,
            _zone1UpperBound,
            _zone2UpperBound,
            _zone1FeeMillionth,
            _zone2FeeMillionth,
            _zone3FeeMillionth
        );
        uint256 expectedFee = feeTier != 0 ? ((uint256(_amountInSD - _deficitSD) * feeTier) / FEE_DENOMINATOR + 1) : 0;
        // vm.assume(expectedFee <= type(uint64).max); // implicitly covered by the assumption below...
        vm.assume(expectedFee <= _amountInSD);

        uint256 expectedReward = (uint256(_amountInSD < _deficitSD ? _amountInSD : _deficitSD) * _rewardMillionth) /
            FEE_DENOMINATOR;
        vm.assume(expectedReward + _amountInSD <= type(uint64).max);

        // 2. set fee configuration
        feeLib.setFeeConfig(
            1, // _dstEid
            _zone1UpperBound,
            _zone2UpperBound,
            _zone1FeeMillionth,
            _zone2FeeMillionth,
            _zone3FeeMillionth,
            _rewardMillionth
        );

        // 3. apply fee (>0) and reward (>0).
        FeeParams memory params = FeeParams(
            address(this), // sender
            1, // dstEid
            _amountInSD,
            _deficitSD, // deficitSD
            true, // toOFT
            true // isTaxi
        );

        // 4. ensure amountOutSD is _amountInSD + expectedReward - expectedFee
        assertEq(feeLib.applyFeeView(params), _amountInSD + expectedReward - expectedFee);
    }

    function test_setFeeConfig(
        uint64 _zone1UpperBound,
        uint64 _zone2UpperBound,
        uint24 _zone1FeeMillionth,
        uint24 _zone2FeeMillionth,
        uint24 _zone3FeeMillionth,
        uint24 _rewardMillionth
    ) public {
        // 1. if the fee is invalid in any way, the function should revert
        if (
            _zone1FeeMillionth > FEE_DENOMINATOR ||
            _zone2FeeMillionth > FEE_DENOMINATOR ||
            _zone3FeeMillionth > FEE_DENOMINATOR ||
            _zone2UpperBound < _zone1UpperBound
        ) {
            vm.expectRevert(FeeLibV1.FeeLib_InvalidFeeConfiguration.selector);
            feeLib.setFeeConfig(
                1,
                _zone1UpperBound,
                _zone2UpperBound,
                _zone1FeeMillionth,
                _zone2FeeMillionth,
                _zone3FeeMillionth,
                _rewardMillionth
            );
        } else {
            // 2. if the fee is valid, ensure it is set and the event emitted
            vm.expectEmit();
            emit FeeLibV1.FeeConfigSet(
                1,
                FeeConfig(
                    false,
                    _zone1UpperBound,
                    _zone2UpperBound,
                    _zone1FeeMillionth,
                    _zone2FeeMillionth,
                    _zone3FeeMillionth,
                    _rewardMillionth
                )
            );
            feeLib.setFeeConfig(
                1,
                _zone1UpperBound,
                _zone2UpperBound,
                _zone1FeeMillionth,
                _zone2FeeMillionth,
                _zone3FeeMillionth,
                _rewardMillionth
            );
            // 3. ensure the fee configuration is set
            (
                bool paused,
                uint64 zone1UpperBound,
                uint64 zone2UpperBound,
                uint24 zone1FeeMillionth,
                uint24 zone2FeeMillionth,
                uint24 zone3FeeMillionth,
                uint24 rewardMillionth
            ) = feeLib.feeConfigs(1);
            assertEq(paused, false);
            assertEq(zone1UpperBound, _zone1UpperBound);
            assertEq(zone2UpperBound, _zone2UpperBound);
            assertEq(zone1FeeMillionth, _zone1FeeMillionth);
            assertEq(zone2FeeMillionth, _zone2FeeMillionth);
            assertEq(zone3FeeMillionth, _zone3FeeMillionth);
            assertEq(rewardMillionth, _rewardMillionth);
        }
    }
}

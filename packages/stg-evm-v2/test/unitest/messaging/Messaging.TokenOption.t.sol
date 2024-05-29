// SPDX-License-Identifier: UNLICENSED

import { EnforcedOptionParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import { Test, console } from "forge-std/Test.sol";
import { TokenMessagingOptions } from "../../../src/messaging/TokenMessagingOptions.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { BytesLib } from "solidity-bytes-utils/contracts/BytesLib.sol";
import { EnforcedOptionParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppOptionsType3.sol";
import { ExecutorDecoder } from "../../utils/ExecutorDecoder.sol";
import { PseudoRandom } from "../lib/lib/PseudoRandom.sol";

pragma solidity ^0.8.0;

contract TokenMessagingOptionsTest is Test, TokenMessagingOptions {
    using BytesLib for bytes;
    using OptionsBuilder for bytes;
    using ExecutorDecoder for bytes;

    uint32 constant EID = 1;
    uint16 constant ASSETID = 1;
    uint128 constant GAS = 100;
    uint128 constant NATIVE_DROP_GAS = 50;
    uint32 internal constant MAX_PSEUDORANDOM_GAS_LIMIT = 1_000_000;
    uint32 internal constant MAX_PSEUDORANDOM_NATIVE_DROP = 1_000_000;

    address public constant ALICE = address(0xace);
    bytes internal constant NOT_OWNER_ERROR = "Ownable: caller is not the owner";
    bytes internal constant SAFECAST_OVERFLOW_ERROR_MESSAGE = "SafeCast: value doesn't fit in 128 bits";

    function setUp() public {
        // Set enforced options
        bytes memory enforcedOption = OptionsBuilder.newOptions().addExecutorLzReceiveOption(GAS, 0);
        EnforcedOptionParam memory enforcedOptionParam = EnforcedOptionParam({
            msgType: this.MSG_TYPE_TAXI(),
            eid: EID,
            options: enforcedOption
        });
        EnforcedOptionParam[] memory enforcedOptions = new EnforcedOptionParam[](1);
        enforcedOptions[0] = enforcedOptionParam;

        vm.prank(this.owner());
        this.setEnforcedOptions(enforcedOptions);
        vm.stopPrank();
    }

    function test_SetGasLimit() public {
        vm.prank(this.owner());
        vm.expectEmit();
        emit GasLimitSet(EID, GAS, NATIVE_DROP_GAS);
        this.setGasLimit(EID, GAS, NATIVE_DROP_GAS);
        (uint128 gasLimit, uint128 nativeDropGasLimit) = this.gasLimits(EID);
        assertEq(gasLimit, GAS);
        assertEq(nativeDropGasLimit, NATIVE_DROP_GAS);

        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        this.setGasLimit(EID, GAS, NATIVE_DROP_GAS);
    }

    function test_RevertIf_BuildOptionWithoutGasLimit(bytes calldata _extraOptions) public {
        vm.expectRevert(MessagingOptions_ZeroGasLimit.selector);
        _buildOptionsForDriveBus(EID, 0, 0, 0);
    }

    function test_BuildOptionsForTaxi() public {
        vm.prank(this.owner());
        bytes memory customerOptions = new bytes(0);
        bytes memory options = this.buildOptionsForTaxi(EID, customerOptions);
        bytes memory expectedOptions = abi.encodePacked(
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(GAS, 0),
            customerOptions
        );

        assertEq(options, expectedOptions);
    }

    function test_BuildOptionsForTaxiWithCustomExtraOptions(bytes calldata customerOptions) public {
        vm.prank(this.owner());
        bytes memory options = this.buildOptionsForTaxi(
            EID,
            abi.encodePacked(OptionsBuilder.newOptions(), customerOptions)
        );
        bytes memory expectedOptions = abi.encodePacked(
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(GAS, 0),
            customerOptions
        );

        assertEq(options, expectedOptions);
    }

    function test_BuildOptionsForDriveBus(
        uint8 _seed,
        bool _includeEnforcedLzReceiveOption,
        uint128 _gasLimit,
        uint128 _nativeDropGasLimit,
        uint8 _numPassengers,
        uint8 _totalNativeDrops,
        uint128 _nativeDropAmount
    ) public {
        vm.assume(_gasLimit > 0 && _gasLimit <= type(uint64).max);
        vm.assume(_nativeDropGasLimit > 0 && _nativeDropGasLimit <= type(uint64).max);
        vm.assume(_numPassengers < 1000);
        vm.assume(_totalNativeDrops <= _numPassengers);
        vm.assume(_nativeDropAmount <= 1000 ether);
        vm.prank(this.owner());
        this.setGasLimit(EID, _gasLimit, _nativeDropGasLimit);

        // The gas limit for the busDrive is the same regardless if there is a enforced option present
        uint128 nativeDropAmount = _totalNativeDrops * _nativeDropAmount;
        uint128 gasLimit = (_gasLimit * _numPassengers) +
            (nativeDropAmount > 0 ? (_nativeDropGasLimit * _totalNativeDrops) : 0);

        if (_includeEnforcedLzReceiveOption) {
            uint128 enforcedGasLimit = uint128(PseudoRandom.random(_seed, MAX_PSEUDORANDOM_GAS_LIMIT));
            uint128 enforcedNativeDrop = uint128(PseudoRandom.random(_seed, MAX_PSEUDORANDOM_NATIVE_DROP));
            bytes memory enforcedOption = OptionsBuilder.newOptions().addExecutorLzReceiveOption(
                enforcedGasLimit,
                enforcedNativeDrop
            );

            EnforcedOptionParam memory enforcedOptionParam = EnforcedOptionParam({
                msgType: MSG_TYPE_BUS,
                eid: EID,
                options: enforcedOption
            });
            EnforcedOptionParam[] memory enforcedOptions = new EnforcedOptionParam[](1);
            enforcedOptions[0] = enforcedOptionParam;
            vm.prank(this.owner());
            this.setEnforcedOptions(enforcedOptions);

            bytes memory busOptions = this.buildOptionsForDrive(EID, _numPassengers, _totalNativeDrops, _nativeDropAmount);
            assertEq(busOptions, enforcedOption.addExecutorLzReceiveOption(gasLimit, nativeDropAmount));
        } else {
            bytes memory busOptions = this.buildOptionsForDrive(EID, _numPassengers, _totalNativeDrops, _nativeDropAmount);
            assertEq(busOptions, OptionsBuilder.newOptions().addExecutorLzReceiveOption(gasLimit, nativeDropAmount));
        }
    }

    function test_BuildOptionsForDriveBus_Overflow() public {
        uint8 numPassengers = 10;
        uint128 gasLimit = type(uint128).max;

        vm.prank(this.owner());
        this.setGasLimit(EID, gasLimit, gasLimit);

        vm.expectRevert(SAFECAST_OVERFLOW_ERROR_MESSAGE);
        this.buildOptionsForDrive(EID, numPassengers, 0, 0);
    }

    function buildOptionsForTaxi(
        uint32 _eid,
        bytes calldata _extraOptions
    ) external view returns (bytes memory options) {
        return _buildOptionsForTaxi(_eid, _extraOptions);
    }

    function buildOptionsForDrive(
        uint32 _eid,
        uint8 _numPassengers,
        uint8 _totalNativeDrops,
        uint128 _nativeDropAmount
    ) external view returns (bytes memory options) {
        return _buildOptionsForDriveBus(_eid, _numPassengers, _totalNativeDrops, _nativeDropAmount);
    }
}

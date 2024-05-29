// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";
import { CreditMessagingOptions } from "../../../src/messaging/CreditMessagingOptions.sol";
import { ExecutorDecoder } from "../../utils/ExecutorDecoder.sol";
import { EnforcedOptionParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";

contract CreditMessagingOptionsTest is Test, CreditMessagingOptions {
    using ExecutorDecoder for bytes;
    using OptionsBuilder for bytes;

    address public constant ALICE = address(0xace);
    bytes internal constant NOT_OWNER_ERROR = "Ownable: caller is not the owner";
    uint32 internal constant DST_EID = 1;

    function test_SetGasLimit() public {
        uint128 gas = 100;
        vm.prank(this.owner());
        vm.expectEmit();
        emit GasLimitSet(DST_EID, gas);
        this.setGasLimit(DST_EID, gas);
        assertEq(gasLimits[DST_EID], gas);

        vm.prank(ALICE);
        vm.expectRevert(NOT_OWNER_ERROR);
        this.setGasLimit(DST_EID, gas);
    }

    function test_RevertIf_BuildOptionsWithoutGasLimit() public {
        vm.expectRevert(MessagingOptions_ZeroGasLimit.selector);
        _buildOptions(DST_EID, 1);
    }

    function test_BuildOptions(uint8 _creditNum, uint64 _gas) public {
        vm.assume(_gas > 0);
        vm.assume(_creditNum > 0);
        uint128 gas = uint128(_gas);
        vm.prank(this.owner());
        this.setGasLimit(DST_EID, gas);
        bytes memory options = _buildOptions(DST_EID, _creditNum);
        (uint256 dstAmount, uint256 totalGas) = options.decodeExecutorOptions();
        assertEq(dstAmount, 0);
        assertEq(totalGas, gas * _creditNum);
    }

    function test_BuildOptionsWithEnforcedOptions(uint8 _creditNum, uint64 _gas, uint64 _enforceGas) public {
        vm.assume(_gas > 0);
        vm.assume(_creditNum > 0);
        vm.assume(_enforceGas > 0);
        uint128 gas = uint128(_gas);
        uint128 enforceGas = uint128(_enforceGas);
        vm.prank(this.owner());
        this.setGasLimit(DST_EID, gas);
        EnforcedOptionParam memory enforcedOptionParam = EnforcedOptionParam({
            msgType: MSG_TYPE_CREDIT_MESSAGING,
            eid: DST_EID,
            options: abi.encodePacked(OptionsBuilder.newOptions().addExecutorLzReceiveOption(enforceGas, 0))
        });
        EnforcedOptionParam[] memory enforcedOptions = new EnforcedOptionParam[](1);
        enforcedOptions[0] = enforcedOptionParam;
        vm.prank(this.owner());
        this.setEnforcedOptions(enforcedOptions);
        bytes memory options = _buildOptions(DST_EID, _creditNum);
        (uint256 dstAmount, uint256 totalGas) = options.decodeExecutorOptions();
        assertEq(dstAmount, 0);
        assertEq(totalGas, gas * _creditNum + enforceGas);
    }
}

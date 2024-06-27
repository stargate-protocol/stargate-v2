// SPDX-LICENSE-IDENTIFIER: UNLICENSED

pragma solidity ^0.8.0;

import { Test } from "@layerzerolabs/toolbox-foundry/lib/forge-std/Test.sol";

import { OFTWrapper } from "../../../../src/peripheral/oft-wrapper/OFTWrapper.sol";

contract OFTWrapperTest is Test {
    bytes internal constant INCORRECT_BPS_ERROR = "OFTWrapper: defaultBps >= 100%";

    function test_constructor(uint16 _defaultBps) public {
        if (_defaultBps >= 10000) {
            vm.expectRevert(INCORRECT_BPS_ERROR);
            new OFTWrapper(_defaultBps);
        } else {
            OFTWrapper wrapper = new OFTWrapper(_defaultBps);
            assertEq(_defaultBps, wrapper.defaultBps());
        }
    }
}

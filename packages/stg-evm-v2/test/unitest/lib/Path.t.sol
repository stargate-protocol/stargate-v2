// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";

import { Path, PathLib } from "../../../src/libs/Path.sol";

import { PseudoRandom } from "./lib/PseudoRandom.sol";

contract TestPath is Test {
    uint64 internal constant UNLIMITED_CREDIT = type(uint64).max; // must match PathLib.UNLIMITED_CREDIT

    Path private path;
    Path private maxPath;

    function setUp() public {
        path = Path(0);
    }

    // isOFTPath is implicitly tested on each assertPathState()

    // setOFTPath
    function test_setOFTPath_true() public {
        path.setOFTPath(true);

        assertPathState(0, true);
    }

    /// @dev Only allowed to set true if no credit
    function testFail_setOFTPath_trueWithCredit() public {
        path.increaseCredit(1);
        path.setOFTPath(true);
    }

    /// @dev Only allowed to set true if previously false
    function testFail_setOFTPath_trueAfterTrue() public {
        path.setOFTPath(true);
        path.setOFTPath(true);
    }

    function test_setOFTPath_trueAfterFalse() public {
        path.setOFTPath(true); // need to set to true so we can
        path.setOFTPath(false); // set to false
        path.setOFTPath(true);

        assertPathState(0, true);
    }

    /// @dev Only allowed to set false if previously true
    function testFail_setOFTPath_false() public {
        path.setOFTPath(false);
    }

    /// @dev Only allowed to set false if previously true
    function testFail_setOFTPath_falseWithCredit() public {
        path.increaseCredit(1);
        path.setOFTPath(false);
    }

    function test_setOFTPath_falseAfterTrue() public {
        path.setOFTPath(true);
        path.setOFTPath(false);

        assertPathState(0, false);
    }

    // increaseCredit()
    /// @dev test that a Path initialized to UNLIMITED_CREDIT does not overflow
    function test_increaseCredit_initializedToMax(uint64 _increment) public {
        maxPath = Path({ credit: UNLIMITED_CREDIT }); // must be storage
        assertEq(maxPath.credit, UNLIMITED_CREDIT);

        // ensure adding credit to max does not overflow
        maxPath.increaseCredit(_increment);
        assertEq(maxPath.credit, UNLIMITED_CREDIT);
    }

    /// @dev uint64-max is a reserved value to signal OFT paths
    function testFail_increaseCredit_invalidMax() public {
        path.increaseCredit(UNLIMITED_CREDIT);
    }

    /// @dev uint64-max is a reserved value to signal OFT paths
    function testFail_increaseCredit_invalidTooHigh() public {
        path.increaseCredit(1);
        path.increaseCredit(UNLIMITED_CREDIT - 1);
    }

    function testFail_increaseCredit_invalidOverflow() public {
        path.increaseCredit(2);
        path.increaseCredit(UNLIMITED_CREDIT - 1);
    }

    function test_increaseCredit_valid() public {
        path.increaseCredit(UNLIMITED_CREDIT - 1);

        assertPathState(UNLIMITED_CREDIT - 1, false);
    }

    function test_increaseCredit_validZero() public {
        path.increaseCredit(0);

        assertPathState(0, false);
    }

    // decreaseCredit()
    function testFail_decreaseCredit_subzero() public {
        path.decreaseCredit(1);
    }

    function test_decreaseCredit_validToZero() public {
        path.increaseCredit(1);
        path.decreaseCredit(1);

        assertPathState(0, false);
    }

    function test_decreaseCredit_validToNonZero() public {
        path.increaseCredit(10);
        path.decreaseCredit(1);

        assertPathState(10 - 1, false);
    }

    function test_tryDecreaseCredit_fromZero() public {
        uint64 actual = path.tryDecreaseCredit(1, 0);

        assertEq(actual, 0);
        assertPathState(0, false);
    }

    function test_tryDecreaseCredit_partial() public {
        path.increaseCredit(1);
        uint64 actual = path.tryDecreaseCredit(10, 0);

        assertEq(actual, 1);
        assertPathState(0, false);

        path.increaseCredit(10);
        actual = path.tryDecreaseCredit(10, 7);
        assertEq(actual, 3);
        assertPathState(7, false);

        actual = path.tryDecreaseCredit(10, 8);
        assertEq(actual, 0);
        assertPathState(7, false);
    }

    function test_tryDecreaseCredit_onOFT() public {
        path.setOFTPath(true);
        vm.expectRevert(PathLib.Path_UnlimitedCredit.selector);
        path.tryDecreaseCredit(1, 0);
    }

    function test_tryDecreaseCredit_validToZero() public {
        path.increaseCredit(1);
        uint64 actual = path.tryDecreaseCredit(1, 0);

        assertEq(actual, 1);
        assertPathState(0, false);
    }

    function test_tryDecreaseCredit_validToNonZero() public {
        path.increaseCredit(10);
        uint64 actual = path.tryDecreaseCredit(1, 0);

        assertEq(actual, 1);
        assertPathState(10 - 1, false);
    }

    // utility
    function assertPathState(uint64 _credit, bool _isOFT) internal {
        if (_isOFT) {
            assertEq(path.credit, type(uint64).max); // implementation detail
        } else {
            assertEq(path.credit, _credit);
        }
        assertEq(path.isOFTPath(), _isOFT);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";

import { CreditMsgCodec, Credit, CreditBatch } from "../../../src/libs/CreditMsgCodec.sol";

import { MockCreditMsgCodec } from "./mocks/MockCreditMsgCodec.sol";
import { PseudoRandom } from "./lib/PseudoRandom.sol";

contract CreditMsgCodecTest is Test {
    MockCreditMsgCodec private mockCreditMsgCodec;

    function setUp() public {
        mockCreditMsgCodec = new MockCreditMsgCodec();
    }

    function getExpectedEncodedByteLength(
        uint256 _numCreditBatches,
        uint256 _totalNumCredits
    ) internal pure returns (uint256) {
        return 1 + _numCreditBatches * 3 + _totalNumCredits * 12; // should match CreditMsgCodec.sol
    }

    function test_encode_decode() public {
        // A basic test case to sanity check the Codec is working as expected.
        CreditBatch[] memory creditBatches = new CreditBatch[](2);
        creditBatches[0] = CreditBatch({ assetId: 1, credits: new Credit[](2) });
        creditBatches[0].credits[0] = Credit({ srcEid: 1, amount: 1 });
        creditBatches[0].credits[1] = Credit({ srcEid: 2, amount: 2 });
        creditBatches[1] = CreditBatch({ assetId: 2, credits: new Credit[](2) });
        creditBatches[1].credits[0] = Credit({ srcEid: 3, amount: 3 });
        creditBatches[1].credits[1] = Credit({ srcEid: 4, amount: 4 });

        bytes memory message = mockCreditMsgCodec.encode(creditBatches, 4);
        assertEq(message.length, getExpectedEncodedByteLength(2, 4)); // sanity check encoded byte length

        CreditBatch[] memory decodedCreditBatches = mockCreditMsgCodec.decode(message);
        assertEq(decodedCreditBatches.length, 2);
        assertEq(decodedCreditBatches[0].assetId, 1);
        assertEq(decodedCreditBatches[0].credits.length, 2);
        assertEq(decodedCreditBatches[0].credits[0].srcEid, 1);
        assertEq(decodedCreditBatches[0].credits[0].amount, 1);
        assertEq(decodedCreditBatches[0].credits[1].srcEid, 2);
        assertEq(decodedCreditBatches[0].credits[1].amount, 2);
        assertEq(decodedCreditBatches[1].assetId, 2);
        assertEq(decodedCreditBatches[1].credits.length, 2);
        assertEq(decodedCreditBatches[1].credits[0].srcEid, 3);
        assertEq(decodedCreditBatches[1].credits[0].amount, 3);
        assertEq(decodedCreditBatches[1].credits[1].srcEid, 4);
        assertEq(decodedCreditBatches[1].credits[1].amount, 4);
    }

    /// @dev Helper function to create CreditBatches for fuzz testing.
    /// @param _numCreditBatches is the number of CreditBatches to create.
    function _createCreditBatches(
        uint256 _numCreditBatches
    ) internal pure returns (CreditBatch[] memory creditBatches, uint256 totalNumCredits) {
        creditBatches = new CreditBatch[](_numCreditBatches);
        totalNumCredits = 0;

        for (uint256 i = 0; i < _numCreditBatches; i++) {
            uint256 numCredits = i + 1;
            Credit[] memory credits = new Credit[](numCredits);
            for (uint256 j = 0; j < numCredits; j++) {
                credits[j] = Credit({ srcEid: uint32(j + 1), amount: uint64(j + 1) });
            }
            totalNumCredits += numCredits;
            creditBatches[i] = CreditBatch({ assetId: uint16(i + 1), credits: credits });
        }
    }

    /// @param _seed is pseudo-random seed.  A uint128 seed is used to avoid numeric overflow in PseudoRandom.random(...) calls.
    function test_fuzz_encode_decode(uint128 _seed) public {
        // Encode between 1 and 10 CreditBatches, each of which has between 1 and 10 Credits.
        // srcEid is between 1 and 10, amount is between 1 wei and 1 ether.
        uint256 numCreditBatches = PseudoRandom.random(_seed, 10); // between 1 and 10 creditBatches, limited only to constrain test time
        (CreditBatch[] memory creditBatches, uint256 totalNumCredits) = _createCreditBatches(numCreditBatches);
        bytes memory message = mockCreditMsgCodec.encode(creditBatches, totalNumCredits);
        assertEq(message.length, getExpectedEncodedByteLength(numCreditBatches, totalNumCredits)); // sanity check encoded byte length

        // deep check each decoded batch matches the corresponding input batch
        CreditBatch[] memory decodedCreditBatches = mockCreditMsgCodec.decode(message);
        for (uint256 i = 0; i < numCreditBatches; i++) {
            assertEq(decodedCreditBatches[i].assetId, creditBatches[i].assetId);
            assertEq(decodedCreditBatches[i].credits.length, creditBatches[i].credits.length);
            for (uint256 j = 0; j < creditBatches[i].credits.length; j++) {
                assertEq(decodedCreditBatches[i].credits[j].srcEid, creditBatches[i].credits[j].srcEid);
                assertEq(decodedCreditBatches[i].credits[j].amount, creditBatches[i].credits[j].amount);
            }
        }
    }

    function test_decode_InvalidMessage(uint8 _seed) public {
        uint256 numCreditBatches = PseudoRandom.random(_seed, 10);
        (CreditBatch[] memory creditBatches, uint256 totalNumCredits) = _createCreditBatches(numCreditBatches);

        bytes memory message = mockCreditMsgCodec.encode(creditBatches, totalNumCredits);
        bytes memory invalidMessage = new bytes(message.length + 1);
        for (uint256 i = 0; i < message.length; i++) {
            invalidMessage[i] = message[i];
        }
        vm.expectRevert(CreditMsgCodec.CreditMsgCodec_InvalidMessage.selector);
        mockCreditMsgCodec.decode(invalidMessage);
    }
}

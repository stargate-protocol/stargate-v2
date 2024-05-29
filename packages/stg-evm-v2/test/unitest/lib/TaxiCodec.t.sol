// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { TaxiCodec } from "../../../src/libs/TaxiCodec.sol";
import { PseudoRandom } from "./lib/PseudoRandom.sol";
import { PassengerUtils } from "./lib/PassengerUtils.sol";
import { MockTaxiCodec } from "./mocks/MockTaxiCodec.sol";
import { MockBusCodec } from "./mocks/MockBusCodec.sol";

contract TaxiCodecTest is Test {
    MockTaxiCodec private mockTaxiCodec;
    MockBusCodec private mockBusCodec;

    function setUp() public {
        mockTaxiCodec = new MockTaxiCodec();
        mockBusCodec = new MockBusCodec();
    }

    function test_is_taxi_true() public view {
        address sender = address(0x1);
        uint16 assetId = 1;
        bytes32 receiver = bytes32(uint256(uint160(address(0x2))));
        uint64 amountSD = 1 ether;
        bytes memory composeMsg = "0x1234";
        bytes memory encodedTaxi = mockTaxiCodec.encodeTaxi(sender, assetId, receiver, amountSD, composeMsg);

        bool result = mockTaxiCodec.isTaxi(encodedTaxi);
        assert(result);
    }

    function test_is_taxi_false(uint8 seed) public view {
        uint16 nativeDropAmount = 1;

        (, bytes memory passengers, uint128 totalNativeDrops) = PassengerUtils.createPassengers(uint32(seed), 10);
        bytes memory busBytes = mockBusCodec.encodeBus(totalNativeDrops, nativeDropAmount, passengers);

        bool result = mockTaxiCodec.isTaxi(busBytes);
        assert(!result);
    }

    function test_encode_decode_taxi() public {
        address sender = address(0x1);
        uint16 assetId = 1;
        bytes32 receiver = bytes32(uint256(uint160(address(0x2))));
        uint64 amountSD = 1 ether;
        bytes memory composeMsg = "0x1234";
        bytes memory encodedTaxi = mockTaxiCodec.encodeTaxi(sender, assetId, receiver, amountSD, composeMsg);

        (
            uint16 decodedAssetId,
            bytes32 decodedReceiver,
            uint64 decodedAmountSD,
            bytes memory decodedComposeMsg
        ) = mockTaxiCodec.decodeTaxi(encodedTaxi);
        assertEq(decodedAssetId, assetId);
        assertEq(decodedReceiver, receiver);
        assertEq(decodedAmountSD, amountSD);

        // Extract the first 32 bytes as bytes32 and convert to address
        bytes32 addr;
        assembly {
            addr := mload(add(decodedComposeMsg, 32))
        }
        address decodedAddress = address(uint160(uint256(addr)));
        assertEq(decodedAddress, sender);

        // Extract the remaining part as the message
        bytes memory message = new bytes(decodedComposeMsg.length - 32);
        for (uint i = 32; i < decodedComposeMsg.length; i++) {
            message[i - 32] = decodedComposeMsg[i];
        }
        bytes memory decodedMessage = message;
        assertEq(decodedMessage, composeMsg);
    }

    /// @param seed is pseudo-random seed. A uint128 seed is used to avoid numeric overflow in PseudoRandom.random(...) calls.
    function test_fuzzy_encode_decode_taxi(
        uint128 seed,
        address sender,
        uint16 assetId,
        bytes32 receiver,
        uint64 amountSD
    ) public {
        bytes memory composeMsg = PseudoRandom.randomEmptyOrPopulatedBytes(seed, PseudoRandom.random(seed, 20_000)); // between 0 and 20k bytes length

        bool isComposeMsgEmpty;
        if (composeMsg.length == 0) isComposeMsgEmpty = true;

        bytes memory encodedTaxi = mockTaxiCodec.encodeTaxi(sender, assetId, receiver, amountSD, composeMsg);
        (
            uint16 decodedAssetId,
            bytes32 decodedReceiver,
            uint64 decodedAmountSD,
            bytes memory decodedComposeMsg
        ) = mockTaxiCodec.decodeTaxi(encodedTaxi);
        assertEq(decodedAssetId, assetId);
        assertEq(decodedReceiver, receiver);
        assertEq(decodedAmountSD, amountSD);

        if (isComposeMsgEmpty) {
            assertEq(decodedComposeMsg, composeMsg);
        } else {
            // Extract the first 32 bytes as bytes32 and convert to address
            bytes32 addr;
            assembly {
                addr := mload(add(decodedComposeMsg, 32))
            }
            address decodedAddress = address(uint160(uint256(addr)));
            assertEq(decodedAddress, sender);

            // Extract the remaining part as the message
            bytes memory message = new bytes(decodedComposeMsg.length - 32);
            for (uint i = 32; i < decodedComposeMsg.length; i++) {
                message[i - 32] = decodedComposeMsg[i];
            }
            bytes memory decodedMessage = message;
            assertEq(decodedMessage, composeMsg);
        }
    }
}

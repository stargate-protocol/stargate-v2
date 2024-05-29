// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { AddressCast } from "../../../../src/libs/AddressCast.sol";
import { BusPassenger } from "../../../../src/libs/BusCodec.sol";
import { PseudoRandom } from "./PseudoRandom.sol";

library TokenMsgUtils {
    using AddressCast for address;

    /// @dev The maximum value for the amountSD field in a TransferPayloadDetails.
    uint64 internal constant MAX_AMOUNT_SD_PER_TRANSFER_PAYLOAD = 1 ether;

    /// @dev A BusPassenger factory function that creates a BusPassenger with pseudorandom values (for use in testing).
    function createPseudorandomBusPassenger(
        uint256 _seed
    ) public view returns (BusPassenger memory) {
        uint16 assetId = uint16(PseudoRandom.random(_seed, 10));
        address receiver = PseudoRandom.randomAddress(_seed + 2);
        uint64 amountSD = uint64(PseudoRandom.random(_seed + 3, MAX_AMOUNT_SD_PER_TRANSFER_PAYLOAD));
        bool nativeDrop = uint128(PseudoRandom.random(_seed + 4, 2)) == 1;

        return
            BusPassenger({
                assetId: assetId,
                receiver: receiver.toBytes32(),
                amountSD: amountSD,
                nativeDrop: nativeDrop
            });
    }
}

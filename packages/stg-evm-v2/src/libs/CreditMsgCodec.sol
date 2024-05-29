// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Buffer } from "@ensdomains/buffer/contracts/Buffer.sol";

import { Credit } from "../interfaces/ICreditMessagingHandler.sol";

struct CreditBatch {
    uint16 assetId;
    Credit[] credits;
}

library CreditMsgCodec {
    using Buffer for Buffer.buffer;
    using SafeCast for uint256;

    /// @dev The byte width of the amount field in the credit message.
    uint8 internal constant AMOUNT_BYTE_WIDTH = 8;

    /// @dev The byte width of the assetId field in the credit message.
    uint8 internal constant ASSET_ID_BYTE_WIDTH = 2;

    /// @dev The byte width of the srcEid field in the credit message.
    uint8 internal constant EID_BYTE_WIDTH = 4;

    /// @dev The byte width of the numBatches field in the credit message.
    uint8 internal constant NUM_BATCHES_BYTE_WIDTH = 1;

    /// @dev The byte width of the numCredits field in the credit batch.
    uint8 internal constant NUM_CREDITS_BYTE_WIDTH = 1;

    error CreditMsgCodec_InvalidMessage();

    function encode(
        CreditBatch[] memory _creditBatches,
        uint256 _totalCreditNum
    ) internal pure returns (bytes memory message) {
        uint256 numBatches = _creditBatches.length;
        // batchNum(1) + batchNum * (assetId(2) + batchSize(1)) + creditNum * (srcEid(4) + amount(8))
        uint256 bufferSize = NUM_BATCHES_BYTE_WIDTH +
            numBatches *
            (NUM_CREDITS_BYTE_WIDTH + ASSET_ID_BYTE_WIDTH) +
            _totalCreditNum *
            (EID_BYTE_WIDTH + AMOUNT_BYTE_WIDTH);
        Buffer.buffer memory buf;
        buf.init(bufferSize);
        buf.appendUint8(numBatches.toUint8());
        for (uint256 i = 0; i < numBatches; i++) {
            CreditBatch memory batch = _creditBatches[i];
            buf.appendInt(batch.assetId, ASSET_ID_BYTE_WIDTH);
            uint256 batchSize = batch.credits.length;
            buf.appendUint8(batchSize.toUint8());
            for (uint256 j = 0; j < batchSize; j++) {
                Credit memory credit = batch.credits[j];
                buf.appendInt(credit.srcEid, EID_BYTE_WIDTH);
                buf.appendInt(credit.amount, AMOUNT_BYTE_WIDTH);
            }
        }
        message = buf.buf;
    }

    function decode(bytes calldata _message) internal pure returns (CreditBatch[] memory creditBatches) {
        uint8 batchNum = uint8(_message[0]);
        creditBatches = new CreditBatch[](batchNum);
        uint256 cursor = 1; // skip batchNum(1)
        for (uint256 i = 0; i < batchNum; i++) {
            uint16 assetId = uint16(bytes2(_message[cursor:cursor += ASSET_ID_BYTE_WIDTH]));
            uint8 batchSize = uint8(_message[cursor]);
            cursor += NUM_BATCHES_BYTE_WIDTH;
            Credit[] memory credits = new Credit[](batchSize);
            for (uint256 j = 0; j < batchSize; j++) {
                uint32 srcEid = uint32(bytes4(_message[cursor:cursor += EID_BYTE_WIDTH]));
                uint64 amount = uint64(bytes8(_message[cursor:cursor += AMOUNT_BYTE_WIDTH]));
                credits[j] = Credit(srcEid, amount);
            }
            creditBatches[i] = CreditBatch(assetId, credits);
        }
        if (cursor != _message.length) revert CreditMsgCodec_InvalidMessage();
    }
}

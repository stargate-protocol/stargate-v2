// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { OAppOptionsType3 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { Buffer } from "@ensdomains/buffer/contracts/Buffer.sol";

/// @title Credit Messaging implementation of OAppOptionsType3
/// @notice This contract is used to build options for the CreditMessaging OApp.
abstract contract CreditMessagingOptions is OAppOptionsType3 {
    using Buffer for Buffer.buffer;

    /// @dev CreditMessaging only has one type of message.
    uint8 internal constant MSG_TYPE_CREDIT_MESSAGING = 3; // only one message type for credit messaging

    uint8 internal constant EXECUTOR_WORKER_ID = 1;
    uint8 internal constant OPTION_TYPE_LZRECEIVE = 1;
    uint16 internal constant OPTION_LZRECEIVE_PARAMS_SIZE = 17; // type(1) + gas(16)

    /// @dev The base gas limit for each endpoint.
    mapping(uint32 eid => uint128 gasLimit) public gasLimits;

    /// @notice Event emitted when the gas limit is set for a given endpoint.
    /// @param eid The LayerZero endpoint ID.
    /// @param gasLimit The base gas limit for the destination endpoint.
    event GasLimitSet(uint32 eid, uint128 gasLimit);

    /// @notice Error message for when the gas limit is not set for a given endpoint.
    /// @dev Zero gas limit is considered not set.
    error MessagingOptions_ZeroGasLimit();

    /// @notice Sets the base gas limit for a specific endpoint.  Sending a LayerZero message takes some constant amount
    /// of base gas regardless of the number of credits being sent in a particular message.  This function allows the
    /// CreditMessaging OApp to set the base gas limit.
    /// @param _eid The LayerZero endpoint ID.
    /// @param _gasLimit The base gas limit for the destination endpoint.
    function setGasLimit(uint32 _eid, uint128 _gasLimit) external onlyOwner {
        gasLimits[_eid] = _gasLimit;
        emit GasLimitSet(_eid, _gasLimit);
    }

    /// @notice Build the options for a credit messaging transaction.
    /// @param _eid The LayerZero endpoint ID.
    /// @param _totalCreditNum The total number of credits being sent in the message.
    /// @return options The options for the message.
    /// @dev The options are built by appending the lzReceive option to the enforced options for the given endpoint.
    function _buildOptions(uint32 _eid, uint128 _totalCreditNum) internal view returns (bytes memory options) {
        uint128 gasLimit = _safeGetGasLimit(_eid) * _totalCreditNum;
        options = enforcedOptions[_eid][MSG_TYPE_CREDIT_MESSAGING];

        // append lzReceive option
        options = options.length == 0
            ? abi.encodePacked(
                OPTION_TYPE_3,
                EXECUTOR_WORKER_ID,
                OPTION_LZRECEIVE_PARAMS_SIZE,
                OPTION_TYPE_LZRECEIVE,
                gasLimit
            )
            : abi.encodePacked(
                options,
                EXECUTOR_WORKER_ID,
                OPTION_LZRECEIVE_PARAMS_SIZE,
                OPTION_TYPE_LZRECEIVE,
                gasLimit
            );
    }

    /// @notice Safely retrieves the base gas limit for a given endpoint.  The base gas limit is the constant amount of
    /// gas required to send a message to the endpoint, regardless of the number of credits being sent.
    /// @param _eid The LayerZero endpoint ID.
    /// @return gasLimit The gas limit for the destination endpoint.
    /// @dev If the gas limit is not set, this function will revert.
    function _safeGetGasLimit(uint32 _eid) private view returns (uint128 gasLimit) {
        gasLimit = gasLimits[_eid];
        if (gasLimit == 0) revert MessagingOptions_ZeroGasLimit();
    }
}

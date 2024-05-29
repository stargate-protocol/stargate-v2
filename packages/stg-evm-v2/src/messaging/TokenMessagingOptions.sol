// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import { OAppOptionsType3 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";

struct GasLimit {
    uint128 gasLimit;
    uint128 nativeDropGasLimit;
}

contract TokenMessagingOptions is OAppOptionsType3 {
    uint8 public constant MSG_TYPE_TAXI = 1;
    uint8 public constant MSG_TYPE_BUS = 2;

    uint8 internal constant EXECUTOR_WORKER_ID = 1;
    uint8 internal constant OPTION_TYPE_LZRECEIVE = 1;
    uint16 internal constant OPTION_LZRECEIVE_BASE_PARAMS_SIZE = 17; // type(1) + gas(16)
    uint16 internal constant OPTION_LZRECEIVE_PARAMS_SIZE = 33; // type(1) + gas(16) + value(16)

    uint256 internal constant PASSENGER_SIZE = 43;

    mapping(uint32 eid => GasLimit gasLimit) public gasLimits;

    event GasLimitSet(uint32 eid, uint128 gasLimit, uint128 nativeDropGasLimit);

    error MessagingOptions_ZeroGasLimit();

    function setGasLimit(uint32 _eid, uint128 _gasLimit, uint128 _nativeDropGasLimit) external onlyOwner {
        gasLimits[_eid] = GasLimit(_gasLimit, _nativeDropGasLimit);
        emit GasLimitSet(_eid, _gasLimit, _nativeDropGasLimit);
    }

    function _buildOptionsForTaxi(
        uint32 _eid,
        bytes calldata _extraOptions
    ) internal view returns (bytes memory options) {
        options = combineOptions(_eid, MSG_TYPE_TAXI, _extraOptions);
    }

    function _buildOptionsForDriveBus(
        uint32 _eid,
        uint8 _numPassengers,
        uint256 _totalNativeDrops,
        uint128 _nativeDropAmount
    ) internal view returns (bytes memory options) {
        // determine the gasLimit for delivering N passengers
        (uint128 gasLimit, uint128 nativeDropGasLimit) = _safeGetGasLimit(_eid);
        uint128 totalGas = SafeCast.toUint128(uint256(gasLimit) * _numPassengers);

        // calculate the total amount of native to drop
        uint128 totalNativeDropAmount = SafeCast.toUint128(_totalNativeDrops * _nativeDropAmount);

        // append the extraGas that is needed to distribute the _nativeDropAmount amongst the passengers with a drop
        if (totalNativeDropAmount > 0) totalGas += SafeCast.toUint128(nativeDropGasLimit * _totalNativeDrops);

        // generate the lzReceive options
        bytes memory lzReceiveOptions = totalNativeDropAmount > 0
            ? abi.encodePacked(
                EXECUTOR_WORKER_ID,
                OPTION_LZRECEIVE_PARAMS_SIZE,
                OPTION_TYPE_LZRECEIVE,
                totalGas,
                totalNativeDropAmount
            )
            : abi.encodePacked(EXECUTOR_WORKER_ID, OPTION_LZRECEIVE_BASE_PARAMS_SIZE, OPTION_TYPE_LZRECEIVE, totalGas);

        // if enforced options are present, concat them
        bytes memory enforced = enforcedOptions[_eid][MSG_TYPE_BUS];
        if (enforced.length >= 2) {
            options = abi.encodePacked(enforced, lzReceiveOptions);
        } else {
            options = abi.encodePacked(OPTION_TYPE_3, lzReceiveOptions);
        }
    }

    function _safeGetGasLimit(uint32 _eid) private view returns (uint128 gasLimit, uint128 nativeDropGasLimit) {
        GasLimit memory g = gasLimits[_eid];
        gasLimit = g.gasLimit;
        nativeDropGasLimit = g.nativeDropGasLimit;
        // dont require setting nativeDropGasLimit
        if (gasLimit == 0) revert MessagingOptions_ZeroGasLimit();
    }
}

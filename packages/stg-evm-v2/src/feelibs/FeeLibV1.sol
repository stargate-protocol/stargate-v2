// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { IStargate, StargateType } from "../interfaces/IStargate.sol";
import { IStargateFeeLib, FeeParams } from "../interfaces/IStargateFeeLib.sol";

/// @dev A configuration that defines 3 zones for calculating fees. The zones are separated by upper bounds.
/// @dev Depending on the amount transferred, one of these three different rates is applied.
/// @dev The rate is stored as parts per million and signifies fee, no fee or reward.
/// @dev The amount given to the contract is considered the inflow. The outflow is then calculated; which is
/// @dev how many tokens the sender will receive on the destination chain. If outflow < inflow, then a fee is charged.
/// @dev If outflow == inflow there is no fee. If outflow > inflow, it means there is a reward.
/// @dev This translates to:
/// @dev     rate < FEE_DENOMINATOR -> fee
/// @dev     rate == FEE_DENOMINATOR -> no fee
/// @dev     rate > FEE_DENOMINATOR -> reward
/// @dev A paused flag is included to pause the fee calculation for a destination.
struct FeeConfig {
    bool paused;
    uint64 zone1UpperBound;
    uint64 zone2UpperBound;
    uint24 zone1FeeMillionth; // in millionth (1/1_000_000)
    uint24 zone2FeeMillionth;
    uint24 zone3FeeMillionth;
    uint24 rewardMillionth;
}

/// @title FeeLibV1
/// @notice An implementation of IStargateFeeLib used to calculate fees for Stargate transfers.
contract FeeLibV1 is Ownable, IStargateFeeLib {
    using SafeCast for uint256;

    address public immutable stargate;
    StargateType public immutable stargateType;

    uint256 internal constant FEE_DENOMINATOR = 1_000_000;

    mapping(uint32 eid => FeeConfig config) public feeConfigs;

    error FeeLib_InvalidFeeConfiguration();
    error FeeLib_Paused();
    error FeeLib_Unauthorized();

    event FeeConfigSet(uint32 eid, FeeConfig config);
    event PausedSet(uint32 eid, bool isPaused);

    modifier onlyStargate() {
        if (msg.sender != stargate) revert FeeLib_Unauthorized();
        _;
    }

    constructor(address _stargate) {
        stargate = _stargate;
        stargateType = IStargate(_stargate).stargateType();
    }

    /// @notice Set the new configuration for a destination.
    /// @param _dstEid The destination endpoint ID
    /// @param _zone1UpperBound The upper bound for the first zone
    /// @param _zone2UpperBound The upper bound for the second zone
    /// @param _zone1FeeMillionth The fee for the first zone in millionth
    /// @param _zone2FeeMillionth The fee for the second zone in millionth
    /// @param _zone3FeeMillionth The fee for the third zone in millionth
    /// @param _rewardMillionth The reward in millionth
    function setFeeConfig(
        uint32 _dstEid,
        uint64 _zone1UpperBound,
        uint64 _zone2UpperBound,
        uint24 _zone1FeeMillionth,
        uint24 _zone2FeeMillionth,
        uint24 _zone3FeeMillionth,
        uint24 _rewardMillionth
    ) external onlyOwner {
        if (
            _zone1FeeMillionth > FEE_DENOMINATOR || // fee maxes at 100% (reward could be > %100)
            _zone2FeeMillionth > FEE_DENOMINATOR ||
            _zone3FeeMillionth > FEE_DENOMINATOR ||
            _zone2UpperBound < _zone1UpperBound // zone2UpperBound must be >= than zone1UpperBound
        ) revert FeeLib_InvalidFeeConfiguration();

        /// @dev config.paused persists from the original setting
        FeeConfig storage config = feeConfigs[_dstEid];
        config.zone1UpperBound = _zone1UpperBound;
        config.zone2UpperBound = _zone2UpperBound;
        config.zone1FeeMillionth = _zone1FeeMillionth;
        config.zone2FeeMillionth = _zone2FeeMillionth;
        config.zone3FeeMillionth = _zone3FeeMillionth;
        config.rewardMillionth = _rewardMillionth;

        emit FeeConfigSet(_dstEid, config);
    }

    /// @notice Pause fee calculation for a destination.
    /// @param _dstEid The destination LayerZero endpoint ID
    /// @param _isPaused A flag indicating whether or not the destination is paused.
    function setPaused(uint32 _dstEid, bool _isPaused) external onlyOwner {
        feeConfigs[_dstEid].paused = _isPaused;
        emit PausedSet(_dstEid, _isPaused);
    }

    /// @dev Included to future proof the API to allow for fees to modify state.
    /// @dev In the case of the FeeLibV1 implementation, state is not modified.
    function applyFee(FeeParams calldata _params) public view override onlyStargate returns (uint64 amountOutSD) {
        return applyFeeView(_params);
    }

    /// @notice Apply fee to the request parameters and calculate the expected output amount on the destination chain
    /// @dev Reverts with Paused if the path is paused.
    /// @param _params The transfer information, namely the amount and destination
    /// @return amountOutSD The number of tokens the sender will receive on the destination chain, in shared decimals.
    function applyFeeView(FeeParams calldata _params) public view override returns (uint64 amountOutSD) {
        FeeConfig storage config = feeConfigs[_params.dstEid];
        if (config.paused) revert FeeLib_Paused();

        uint64 amountInSD = _params.amountInSD;
        uint64 deficitSD = _params.deficitSD;
        uint24 rewardMillionth = config.rewardMillionth;
        if (stargateType == StargateType.OFT || deficitSD == 0 || rewardMillionth == 0) {
            // if the stargate is OFT or there is no deficit, apply fee to the whole amount
            amountOutSD = amountInSD - _calculateFee(config, amountInSD);
        } else if (amountInSD <= deficitSD) {
            // if the amount is less than the deficit, apply reward to the whole amount
            amountOutSD = amountInSD + _calculateReward(rewardMillionth, amountInSD);
        } else {
            // if the amount is more than the deficit, apply reward to the deficit and fee to the rest
            amountOutSD =
                amountInSD +
                _calculateReward(rewardMillionth, deficitSD) -
                _calculateFee(config, amountInSD - deficitSD);
        }
    }

    function _calculateFee(FeeConfig storage _config, uint64 _amountSD) internal view returns (uint64 fee) {
        uint256 feeMill = _amountSD <= _config.zone1UpperBound
            ? _config.zone1FeeMillionth
            : _amountSD <= _config.zone2UpperBound
                ? _config.zone2FeeMillionth
                : _config.zone3FeeMillionth;
        // if feeMill is non-zero and _amountSD is non-zero, then levy the fee
        if (feeMill > 0 && _amountSD > 0) {
            // converts intermediate operands to use uint256 containers
            // as after dividing by FEE_DENOMINATOR, the result may fit in a uint64
            //
            // adds one to ensure fee is always rounded up
            fee = SafeCast.toUint64((uint256(_amountSD) * feeMill) / FEE_DENOMINATOR + 1);
        }
    }

    function _calculateReward(uint24 _rewardMillionth, uint64 _amountSD) internal pure returns (uint64 reward) {
        // converts intermediate operands to use uint256 containers
        // as after dividing by FEE_DENOMINATOR, the result may fit in a uint64
        reward = SafeCast.toUint64((uint256(_amountSD) * _rewardMillionth) / FEE_DENOMINATOR);
    }
}

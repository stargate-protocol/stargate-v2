// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev giving fee rebate prorata based on accumulated scores;
contract RebateCampaign is Ownable {
    uint256 public immutable START_TIME;
    uint256 public immutable END_TIME;
    address public immutable feeLib;
    // todo: add cap and view functions?

    mapping(address payer => uint256 amount) public scores;
    uint256 public sum;

    //
    bool public rewardAdded;
    address public token;
    uint256 public totalRewards;

    error Rebate_Unauthorized();
    error Rebate_RewardAlreadyAdded();
    error Rebate_TooEarly();
    error Rebate_ZeroScore();

    constructor(uint256 _startTime, uint256 _endTime, address _feeLib) {
        START_TIME = _startTime;
        END_TIME = _endTime;
        feeLib = _feeLib;
    }

    // call from fee lib only
    function tryAdd(address _payer, uint256 _amount) external {
        if (msg.sender != feeLib) revert Rebate_Unauthorized();
        if (block.timestamp <= END_TIME && block.timestamp >= START_TIME) {
            scores[_payer] += _amount;
            sum += _amount;
        }
    }

    // owner only
    function addReward(address _token, uint256 _amount) external onlyOwner {
        if (rewardAdded) revert Rebate_RewardAlreadyAdded();
        rewardAdded = true;
        token = _token;
        totalRewards = _amount;
        // transferFrom the caller
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
    }

    // claimer only
    function claimReward() external {
        if (block.timestamp < END_TIME) revert Rebate_TooEarly();
        uint256 score = scores[msg.sender];
        if (score == 0) revert Rebate_ZeroScore();
        uint256 reward = (score * totalRewards) / sum;
        delete scores[msg.sender];
        IERC20(token).transfer(msg.sender, reward);
    }
}

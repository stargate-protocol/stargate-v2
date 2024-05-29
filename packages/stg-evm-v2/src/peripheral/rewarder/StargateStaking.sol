// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { StakingLib, StakingPool } from "./lib/StakingLib.sol";
import { IStargateStaking, IRewarder, IStakingReceiver, IERC20 } from "./interfaces/IStargateStaking.sol";

/// @notice See `IStargateStaking` for documentation.
contract StargateStaking is Ownable, ReentrancyGuard, IStargateStaking {
    using EnumerableSet for EnumerableSet.AddressSet;
    using StakingLib for StakingPool;

    EnumerableSet.AddressSet private _tokens;
    mapping(IERC20 lpToken => StakingPool) private _pools;

    modifier validPool(IERC20 token) {
        _validatePool(token);
        _;
    }

    function _validatePool(IERC20 token) internal view {
        if (!_pools[token].exists) revert NonExistentPool(token);
    }

    //** ADMIN FUNCTIONS **/

    function setPool(IERC20 token, IRewarder newRewarder) external override onlyOwner {
        bool exists = _pools[token].exists;
        if (!exists) {
            _pools[token].exists = true;
            _tokens.add(address(token));
        }
        // Prevents re-adding of an old rewarder to a pool, which could lead to excessive reward distribution.
        newRewarder.connect(token);
        _pools[token].rewarder = newRewarder;

        emit PoolSet(token, newRewarder, exists);
    }

    function renounceOwnership() public view override onlyOwner {
        revert StargateStakingRenounceOwnershipDisabled();
    }

    //** USER FUNCTIONS **/

    function deposit(IERC20 token, uint256 amount) external override nonReentrant validPool(token) {
        _pools[token].deposit(token, msg.sender, msg.sender, amount);
    }

    function depositTo(IERC20 token, address to, uint256 amount) external override nonReentrant validPool(token) {
        if (!Address.isContract(msg.sender)) revert InvalidCaller();
        _pools[token].deposit(token, msg.sender, to, amount);
    }

    function withdraw(IERC20 token, uint256 amount) external override nonReentrant validPool(token) {
        _pools[token].withdraw(token, msg.sender, msg.sender, amount, true);
    }

    function withdrawToAndCall(
        IERC20 token,
        IStakingReceiver to,
        uint256 amount,
        bytes calldata data
    ) external override nonReentrant validPool(token) {
        if (!Address.isContract(address(to))) {
            revert InvalidReceiver(address(to));
        }
        _pools[token].withdraw(token, msg.sender, address(to), amount, true);
        /**
         * @dev This line reverts ambiguously if the `to` does not return a response, but is a contract. This could be
         *      solved similar to [OpenZeppelin's approach](https://github.com/OpenZeppelin/openzeppelin-contracts/blob
         *      /141c947921cc5d23ee1d247c691a8b85cabbbd5d/contracts/token/ERC1155/utils/ERC1155Utils.sol#L22), but we've
         *      opted against this for now as to avoid all inline assembly within this project.
         */
        if (to.onWithdrawReceived(token, msg.sender, amount, data) != IStakingReceiver.onWithdrawReceived.selector) {
            revert InvalidReceiver(address(to));
        }
    }

    function emergencyWithdraw(IERC20 token) external override nonReentrant validPool(token) {
        uint256 amount = _pools[token].balanceOf[msg.sender];
        _pools[token].withdraw(token, msg.sender, msg.sender, amount, false);
    }

    function claim(IERC20[] calldata lpTokens) external override nonReentrant {
        for (uint256 i = 0; i < lpTokens.length; i++) {
            IERC20 token = lpTokens[i];
            _validatePool(token);
            _pools[token].claim(token, msg.sender);
        }
    }

    //** VIEW FUNCTIONS **//

    function isPool(IERC20 token) external view override returns (bool) {
        return _pools[token].exists;
    }

    function tokensLength() external view override returns (uint256) {
        return _tokens.length();
    }

    function tokens() external view override returns (IERC20[] memory) {
        return tokens(0, _tokens.length());
    }

    function tokens(uint256 start, uint256 end) public view override returns (IERC20[] memory) {
        IERC20[] memory result = new IERC20[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = IERC20(_tokens.at(i));
        }
        return result;
    }

    function balanceOf(IERC20 token, address user) external view override returns (uint256) {
        return _pools[token].balanceOf[user];
    }

    function totalSupply(IERC20 token) external view override returns (uint256) {
        return _pools[token].totalSupply;
    }

    function rewarder(IERC20 token) external view override returns (IRewarder) {
        return _pools[token].rewarder;
    }
}

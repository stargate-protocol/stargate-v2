// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { StargateType, MessagingReceipt, MessagingFee, SendParam, OFTReceipt } from "./interfaces/IStargate.sol";
import { IStargatePool } from "./interfaces/IStargatePool.sol";
import { ITokenMessaging, TaxiParams } from "./interfaces/ITokenMessaging.sol";
import { Transfer } from "./libs/Transfer.sol";
import { StargateBase, FeeParams } from "./StargateBase.sol";
import { LPToken } from "./utils/LPToken.sol";

/// @title A Stargate contract representing a liquidity pool. Users can deposit tokens into the pool and receive
/// @title LP tokens in exchange, which can be later be redeemed to recover their deposit and a reward which is
/// @title a fraction of the fee accrued by the liquidity pool during the staking time.
contract StargatePool is StargateBase, IStargatePool {
    LPToken internal immutable lp;

    uint64 internal tvlSD;
    uint64 internal poolBalanceSD;
    uint64 internal deficitOffsetSD;

    event Deposited(address indexed payer, address indexed receiver, uint256 amountLD);
    event Redeemed(address indexed payer, address indexed receiver, uint256 amountLD);

    error Stargate_OnlyTaxi();

    /// @notice Create a Stargate pool to provide liquidity. This also creates the LP token contract.
    /// @param _lpTokenName The name for the LP token
    /// @param _lpTokenSymbol The symbol for the LP token
    /// @param _token The token for the pool or oft. If the token is address(0), it is the native coin
    /// @param _tokenDecimals The number of decimals for this tokens implementation on this chain
    /// @param _sharedDecimals The number of decimals shared between all implementations of the OFT
    /// @param _endpoint The LZ endpoint contract
    /// @param _owner The owner of this contract
    constructor(
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        address _token,
        uint8 _tokenDecimals,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargateBase(_token, _tokenDecimals, _sharedDecimals, _endpoint, _owner) {
        lp = new LPToken(_lpTokenName, _lpTokenSymbol, _tokenDecimals);
    }

    // -------- LP operations --------

    /// @notice Deposit token into the pool
    /// @dev Emits Deposited when the token is deposited
    /// @param _receiver The account to mint the LP tokens to
    /// @param _amountLD The amount of tokens to deposit in LD
    /// @return amountLD The actual amount of tokens deposited in LD
    function deposit(
        address _receiver,
        uint256 _amountLD
    ) external payable nonReentrantAndNotPaused returns (uint256 amountLD) {
        // charge the sender
        _assertMsgValue(_amountLD);
        uint64 amountSD = _inflow(msg.sender, _amountLD);
        _postInflow(amountSD); // increase the local credit and pool balance

        // mint LP token to the receiver
        amountLD = _sd2ld(amountSD);
        lp.mint(_receiver, amountLD);
        tvlSD += amountSD;
        emit Deposited(msg.sender, _receiver, amountLD);
    }

    /// @notice Redeem the LP token of the sender and return the underlying token to receiver
    /// @dev Emits Redeemed when the LP tokens are redeemed successfully.
    /// @dev Reverts if the sender does not hold enough LP tokens or if the pool does not have enough credit.
    /// @param _amountLD The amount of LP token to redeem in LD
    /// @param _receiver The account to which to return the underlying tokens
    /// @return amountLD The amount of LP token burned and the amount of underlying token sent to the receiver
    function redeem(uint256 _amountLD, address _receiver) external nonReentrantAndNotPaused returns (uint256 amountLD) {
        uint64 amountSD = _ld2sd(_amountLD);
        paths[localEid].decreaseCredit(amountSD);

        // de-dust LP token
        amountLD = _sd2ld(amountSD);
        // burn LP token. Will revert if the sender doesn't have enough LP token
        lp.burnFrom(msg.sender, amountLD);
        tvlSD -= amountSD;

        // send the underlying token from the pool to the receiver
        _safeOutflow(_receiver, amountLD);
        _postOutflow(amountSD); // decrease the pool balance

        emit Redeemed(msg.sender, _receiver, amountLD);
    }

    /// @notice Redeem LP tokens and use the withdrawn tokens to execute a send
    /// @dev Emits Redeemed when the LP tokens are redeemed successfully.
    /// @dev Emits OFTSent when the LP tokens are redeemed successfully.
    /// @param _sendParam The RedeemSendParam object describing the redeem and send
    /// @param _fee The MessagingFee describing the fee to pay for the send
    /// @param _refundAddress The address to refund any LZ fees paid in excess
    /// @return msgReceipt The messaging receipt proving the send
    /// @return oftReceipt The OFT receipt proving the send
    function redeemSend(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    )
        external
        payable
        nonReentrantAndNotPaused
        returns (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt)
    {
        if (!_isTaxiMode(_sendParam.oftCmd)) revert Stargate_OnlyTaxi();

        // remove the dust
        uint64 amountInSD = _ld2sd(_sendParam.amountLD);
        uint256 amountInLD = _sd2ld(amountInSD);

        // burn LP token of 'msg.sender'. it will revert if the sender doesn't have enough LP token
        lp.burnFrom(msg.sender, amountInLD);
        emit Redeemed(msg.sender, address(0), amountInLD);

        // charge fees and handle credit
        FeeParams memory feeParams = _buildFeeParams(_sendParam.dstEid, amountInSD, true);
        uint64 amountOutSD = _chargeFee(feeParams, _ld2sd(_sendParam.minAmountLD));

        // need to update the TVL after charging the fee, otherwise the deficit will be wrong
        tvlSD -= amountInSD;

        // handle credit and pool balance
        // due to the both of them are already increased when deposit, so if
        // 1) the amountOutSD is less than amountInSD, the fee should be removed from both of them
        // 2) the amountOutSD is more than amountInSD, the reward should be added to both of them
        paths[_sendParam.dstEid].decreaseCredit(amountOutSD);
        if (amountInSD > amountOutSD) {
            // fee
            uint64 fee = amountInSD - amountOutSD;
            paths[localEid].decreaseCredit(fee);
            poolBalanceSD -= fee;
        } else if (amountInSD < amountOutSD) {
            // reward
            uint64 reward = amountOutSD - amountInSD;
            paths[localEid].increaseCredit(reward);
            poolBalanceSD += reward;
        }

        // send the token to the receiver
        MessagingFee memory messagingFee = _assertMessagingFee(_fee, 0);
        msgReceipt = _taxi(_sendParam, messagingFee, amountOutSD, _refundAddress);
        oftReceipt = OFTReceipt(amountInLD, _sd2ld(amountOutSD));
        emit OFTSent(msgReceipt.guid, _sendParam.dstEid, msg.sender, amountInLD, oftReceipt.amountReceivedLD);
    }

    /// @notice Get how many LP tokens can be redeemed by a given account.
    /// @dev Use 0x0 to get the total maximum redeemable (since its capped to the local credit)
    /// @param _owner The account to check for
    /// @return amountLD The max amount of LP tokens redeemable by the account
    function redeemable(address _owner) external view returns (uint256 amountLD) {
        uint256 cap = _sd2ld(paths[localEid].credit);
        if (_owner == address(0)) {
            amountLD = cap;
        } else {
            uint256 userLp = lp.balanceOf(_owner);
            amountLD = cap > userLp ? userLp : cap;
        }
    }

    /// @notice Get a quote on the fee associated with a RedeemSend operation
    /// @param _sendParam The RedeemSendParam object describing the RedeemSend
    /// @param _payInLzToken Whether to pay the LZ fee in LZ token
    /// @return fee The MessagingFee object that describes the Fee that would be associated with this RedeemSend
    function quoteRedeemSend(
        SendParam calldata _sendParam,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        if (!_isTaxiMode(_sendParam.oftCmd)) revert Stargate_OnlyTaxi();
        uint64 amountInSD = _ld2sd(_sendParam.amountLD);
        fee = ITokenMessaging(tokenMessaging).quoteTaxi(
            TaxiParams({
                sender: msg.sender,
                dstEid: _sendParam.dstEid,
                receiver: _sendParam.to,
                amountSD: amountInSD,
                composeMsg: _sendParam.composeMsg,
                extraOptions: _sendParam.extraOptions
            }),
            _payInLzToken
        );
    }

    /// @notice Get the total value locked in this pool
    /// @dev The TVL of the pool is the total supply of the LP token since they are minted 1:1.
    /// @return The total value locked in LD
    function tvl() external view override returns (uint256) {
        return _sd2ld(tvlSD);
    }

    /// @notice Get the current pool balance
    /// @dev The pool balance is the total amount of tokens in the pool, it reflects liquidity.
    /// @return The pool balance in LD
    function poolBalance() external view override returns (uint256) {
        return _sd2ld(poolBalanceSD);
    }

    /// @notice Get the current deficit offset
    /// @dev The deficit offset allows manipulation of the ideal pool liquidity beyond surplus 0.
    /// @return The deficit offset in LD
    function deficitOffset() external view returns (uint256) {
        return _sd2ld(deficitOffsetSD);
    }

    /// @notice Returns the type of Stargate contract.
    /// @dev Fulfills the IStargate interface.
    /// @return The type of Stargate contract
    function stargateType() external pure override returns (StargateType) {
        return StargateType.Pool;
    }

    /// @notice Returns the LP token contract used to represent pool ownership.
    /// @return The address of the LP token contract.
    function lpToken() external view override returns (address) {
        return address(lp);
    }

    /// @notice Limits the reward awarded when withdrawing value.
    /// @dev Concretes the StargateBase contract.
    /// @dev Liquidity pools cap the reward to the total fees accrued in the treasury.
    /// @param _amountOutSD The amount of tokens expected on the destination chain in SD
    /// @param _reward The initial calculated reward by FeeLib
    /// @return newAmountOutSD The actual amount to be received on the destination chain
    /// @return newReward The actual reward after applying any caps
    function _capReward(uint64 _amountOutSD, uint64 _reward) internal view override returns (uint64, uint64) {
        uint64 rewardCap = treasuryFee;
        if (_reward > rewardCap) {
            // exceeds cap, recalculate with new reward
            unchecked {
                return (_amountOutSD - _reward + rewardCap, rewardCap);
            }
        } else {
            // lower than cap, return the original values
            return (_amountOutSD, _reward);
        }
    }

    /// @notice Increase the local credit and pool balance
    function _postInflow(uint64 _amountSD) internal override {
        paths[localEid].increaseCredit(_amountSD);
        poolBalanceSD += _amountSD;
    }

    /// @notice Decrease the pool balance
    function _postOutflow(uint64 _amountSD) internal override {
        poolBalanceSD -= _amountSD;
    }

    /// @notice Charge an account an amount of pooled tokens.
    /// @dev Reverts if the charge can not be completed.
    /// @param _from The account to charge
    /// @param _amountLD How many tokens to charge in LD
    /// @return amountSD The amount of tokens charged in SD
    function _inflow(address _from, uint256 _amountLD) internal virtual override returns (uint64 amountSD) {
        amountSD = _ld2sd(_amountLD);
        Transfer.safeTransferTokenFrom(token, _from, address(this), _sd2ld(amountSD)); // remove the dust and transfer
    }

    /// @notice Transfer a token from the pool to an account.
    /// @param _to The destination account
    /// @param _amountLD How many tokens to transfer in LD
    /// @return success Whether the transfer succeeded or not
    function _outflow(address _to, uint256 _amountLD) internal virtual override returns (bool success) {
        success = Transfer.transferToken(token, _to, _amountLD);
    }

    function _buildFeeParams(
        uint32 _dstEid,
        uint64 _amountInSD,
        bool _isTaxi
    ) internal view override returns (FeeParams memory) {
        uint64 t = tvlSD + deficitOffsetSD;
        uint64 deficitSD = t > poolBalanceSD ? t - poolBalanceSD : 0;
        return FeeParams(msg.sender, _dstEid, _amountInSD, deficitSD, paths[_dstEid].isOFTPath(), _isTaxi);
    }

    // ---------------------------------- Only Treasurer ------------------------------------------

    function recoverToken(
        address _token,
        address _to,
        uint256 _amount
    ) public virtual override onlyCaller(treasurer) returns (uint256) {
        // only allow to recover the excess of poolBalanceSD + treasuryFee if the token is the pool token
        if (_token == token) {
            uint256 cap = _thisBalance() - _sd2ld(poolBalanceSD + treasuryFee);
            _amount = _amount > cap ? cap : _amount;
        }
        return super.recoverToken(_token, _to, _amount);
    }

    function _thisBalance() internal view virtual returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // ---------------------------------- Only Planner ------------------------------------------

    function setDeficitOffset(uint256 _deficitOffsetLD) external onlyCaller(planner) {
        deficitOffsetSD = _ld2sd(_deficitOffsetLD);
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { MessagingFee, StargatePool, Transfer } from "./StargatePool.sol";

/// @title A StargatePool which administers a pool of native coin.
contract StargatePoolNative is StargatePool {
    /// @notice Create a StargatePoolNative, which holds native coin and emits LP tokens as rewards to stakers.
    /// @dev The LP OFT contract is created as part of the creation of this contract.
    /// @param _lpTokenName The name of the LP token to create
    /// @param _lpTokenSymbol The symbol of the LP token to create
    /// @param _tokenDecimals The number of decimals to use for the LP token
    /// @param _sharedDecimals The minimum amount of decimals used to represent the native coin across chains
    /// @param _endpoint The LayerZero endpoint contract
    /// @param _owner The owner of this Stargate contract
    constructor(
        string memory _lpTokenName,
        string memory _lpTokenSymbol,
        uint8 _tokenDecimals,
        uint8 _sharedDecimals,
        address _endpoint,
        address _owner
    ) StargatePool(_lpTokenName, _lpTokenSymbol, address(0), _tokenDecimals, _sharedDecimals, _endpoint, _owner) {}

    /// @notice Store native coin in this contract.
    /// @param _amountLD The amount to transfer in LD
    /// @return amountSD The amount to transfer in SD
    function _inflow(address /*_from*/, uint256 _amountLD) internal view override returns (uint64 amountSD) {
        amountSD = _ld2sd(_amountLD);
    }

    /// @notice Send native coin to an account.
    /// @dev Attempts to send the native coin to the receiver with 2300 gas.
    /// @param _to The account to transfer the native coin to
    /// @param _amountLD The value to transfer in LD
    /// @return success Whether The transfer was successful
    function _outflow(address _to, uint256 _amountLD) internal override returns (bool success) {
        success = Transfer.transferNative(_to, _amountLD, true);
    }

    /// @notice Send native coin to an account.
    /// @dev Send the native coin to the receiver with unlimited gas
    /// @dev Reverts with OutflowFailed if the transfer fails.
    /// @dev used in redeem() and retryReceiveToken()
    /// @param _to The account to transfer the native coin to
    /// @param _amountLD The value to transfer in LD
    function _safeOutflow(address _to, uint256 _amountLD) internal override {
        bool success = Transfer.transferNative(_to, _amountLD, false);
        if (!success) revert Stargate_OutflowFailed();
    }

    /// @notice Ensure that the value passed through the message equals the native fee plus the sent amount
    /// @dev Reverts with InvalidAmount if the value passed is less than the expected amount.
    /// @param _fee The MessagingFee object containing the expected fee to check
    /// @param _amountInLD The amount of native token to send
    /// @return An adjusted MessagingFee object that should be used to avoid dust in the msg.value
    function _assertMessagingFee(
        MessagingFee memory _fee,
        uint256 _amountInLD
    ) internal view override returns (MessagingFee memory) {
        uint256 expectedMsgValue = _fee.nativeFee + _amountInLD;
        if (msg.value < expectedMsgValue) revert Stargate_InvalidAmount();
        // there may be some dust left in the msg.value if the token is native coin
        if (msg.value > expectedMsgValue) _fee.nativeFee = msg.value - _amountInLD;
        return _fee;
    }

    /// @notice Assert that the msg value passed matches the expected value.
    /// @dev Override the base implementation to accept exactly the determined amount.
    /// @dev Reverts with InvalidAmount if the expected amount does not match, or if it has dust
    /// @param _amountLD The exact amount of value to expect in LD
    function _assertMsgValue(uint256 _amountLD) internal view override {
        // msg.value should be exactly the same as the amountLD and not have dust
        // _sd2ld(_ld2sd(_amountLD))) removes the dust if any
        if (_amountLD != msg.value || _amountLD != _sd2ld(_ld2sd(_amountLD))) revert Stargate_InvalidAmount();
    }

    function _thisBalance() internal view override returns (uint256) {
        return address(this).balance;
    }

    function _plannerFee() internal view virtual override returns (uint256) {
        return _thisBalance() - _sd2ld(poolBalanceSD + treasuryFee);
    }

    fallback() external payable onlyOwner {}
    receive() external payable onlyOwner {}
}

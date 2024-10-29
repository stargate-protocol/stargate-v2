// SPDX-License-Identifier: Apache 2.0

pragma solidity 0.8.4;

import "../Tether/TetherTokenV2.sol";

/*

   Copyright Tether.to 2024

   Author Will Harborne, Will Norden

   Licensed under the Apache License, Version 2.0
   http://www.apache.org/licenses/LICENSE-2.0

*/


contract TetherTokenCeloExtension is TetherTokenV2 {

  event LogSetFeeCurrencyWrapper(address indexed feeCurrencyWrapper);

  address constant private GAS_FEE_ADDRESS = 0x000000000000000000000000000000000Ce106A5;

  address public feeCurrencyWrapper;

  modifier onlyAuthorizedSender() {
    require(msg.sender == address(0) || msg.sender == feeCurrencyWrapper, "Only VM can call");
    _;
  }

  /**
   * @notice Reserve balance for making payments for gas in this currency.
   * @param from The account to reserve balance from
   * @param value The amount of balance to reserve
   * @dev Note that this function is called by the protocol when paying for tx fees in this
   * currency. After the tx is executed, gas is refunded to the sender and credited to the
   * various tx fee recipients via a call to `creditGasFees`.
   */
  function debitGasFees(address from, uint256 value) external onlyAuthorizedSender {
    _transfer(from, GAS_FEE_ADDRESS, value);
  }

  /**
   * @notice Alternative function to credit balance after making payments
   * for gas in this currency.
   * @param refundRecipient The recipient of the refund.
   * @param tipRecipient The recipient of the tip.
   * @param baseFeeRecipient The recipient of the base fee.
   * @param refundAmount amount to be refunded by the VM
   * @param tipAmount Coinbase fee
   * @param baseFeeAmount Community fund fee
   * @dev Note that this function is called by the protocol when paying for tx fees in this
   * currency. Before the tx is executed, gas is debited from the sender via a call to
   * `debitGasFees`.
   */
  function creditGasFees(
    address refundRecipient,
    address tipRecipient,
    address , // gateWayFeeRecipient is not used anymore
    address baseFeeRecipient,
    uint256 refundAmount,
    uint256 tipAmount,
    uint256 ,
    uint256 baseFeeAmount
  ) external onlyAuthorizedSender {

    if (tipRecipient != address(0)) {
      _transfer(GAS_FEE_ADDRESS, tipRecipient, tipAmount);
    }

    if (baseFeeRecipient != address(0)) {
      _transfer(GAS_FEE_ADDRESS, baseFeeRecipient, baseFeeAmount);
    }

    if (refundAmount > 0) {
      _transfer(GAS_FEE_ADDRESS, refundRecipient, refundAmount);
    }
  }

  function setFeeCurrencyWrapper(address _feeCurrencyWrapper) external onlyOwner {
    feeCurrencyWrapper = _feeCurrencyWrapper;
    emit LogSetFeeCurrencyWrapper(_feeCurrencyWrapper);
  }

}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import { IStargateWrapper } from "./interfaces/IStargateWrapper.sol";

contract StargateWrapper is IStargateWrapper, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public externalSigner;

    // Partners
    mapping(uint256 partnerId => Partner partner) public partners;

    constructor(address owner_) {
        _transferOwnership(owner_);
    }

    modifier onlyActivePartner(uint256 partnerId) {
        if (!partners[partnerId].isActive) revert PartnerNotActive(partnerId);
        _;
    }

    // Partners
    function setPartner(uint256 partnerId, address partnerAddress) external onlyOwner {
        if (partnerAddress == address(0)) revert InvalidZeroAddress();
        if (partnerId == 0) revert InvalidZeroPartnerId();

        partners[partnerId] = Partner(true, partnerAddress);

        emit PartnerSet(partnerId, partnerAddress);
    }

    function pausePartner(uint256 partnerId) external onlyOwner {
        partners[partnerId].isActive = false;

        emit PartnerPaused(partnerId);
    }

    /**
     * ! TBD
     * !  - Should be possible to withdraw fees for paused partner?
     * !  - Should the partner address be stated on chain or be an input parameter?
     * @param partnerId The ID of the partner
     * @param token The token to withdraw the fees
     * @param amount The amount of fees to withdraw
     * @dev only the owner can withdraw the fees
     */
    function withdrawPartnerFees(
        uint256 partnerId,
        address token,
        uint256 amount
    ) external onlyActivePartner(partnerId) onlyOwner {
        if (amount == 0) return;

        address receiver = partners[partnerId].partnerAddress;
        if (receiver == address(0)) revert InvalidZeroAddress();

        emit PartnerFeesWithdrawn(partnerId, token, receiver, amount);
        IERC20(token).safeTransfer(receiver, amount);
    }

    function sweep(address receiver, address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).safeTransfer(receiver, IERC20(tokens[i]).balanceOf(address(this)));
        }
    }

    // Send
    /**
     * @dev only active partners can send operations
     * ! TODO
     * ! - Check the gas and operation params are enough to cover all operation costs
     * !         - CCTP fees - cctp fees + protocol fees + partner fees + the autoclaim fees must be paid
     * !         - Ask multihop particularities.
     * ! - This assumes the protocol and partner fees are paid in the same operation token, explore the possibility of having different tokens for each fee.
     * ! - Check if there is any missing validations.
     */
    function send(
        uint256 partnerId,
        OperationParams calldata operationParams,
        OperationFeeParams calldata operationFeeParams,
        Call calldata call,
        bytes calldata signature
    ) external payable nonReentrant onlyActivePartner(partnerId) {
        // validations
        bool opInNative = operationParams.token == address(0);
        bool opFeeInNative = operationFeeParams.token == address(0);

        // todo the payload should be all received params encoded together, do any adjustments needed
        _validateSignature(
            abi.encode(address(this), block.chainid, partnerId, operationParams, operationFeeParams, call),
            signature
        );
        _validateOperationParams(operationParams);
        _validateCall(call);
        _validateMsgValue(
            opInNative,
            opFeeInNative,
            operationParams.totalAmount,
            operationFeeParams.amount,
            call.value
        );

        // emit the fees for the operation to accumulate the values offchain
        emit WrapperFees(
            partnerId,
            operationParams.token,
            operationParams.partnerFee,
            operationParams.protocolFee,
            operationFeeParams.token,
            operationFeeParams.amount
        );

        // get funds from user to do the operation
        uint256 callValue = call.value;
        if (!opInNative) {
            IERC20(operationParams.token).safeTransferFrom(msg.sender, address(this), operationParams.totalAmount);

            // approve the contracts to spend the funds
            IERC20(operationParams.token).safeApprove(operationParams.ctrAddress, operationParams.amountToSend);
        } else callValue += operationParams.totalAmount;

        if (!opFeeInNative) {
            IERC20(operationFeeParams.token).safeTransferFrom(msg.sender, address(this), operationFeeParams.amount);

            // approve the contracts to spend the funds
            IERC20(operationFeeParams.token).safeApprove(operationFeeParams.ctrAddress, operationFeeParams.amount);
        } else callValue += operationFeeParams.amount;

        // do the wrapped operation
        (bool success, bytes memory result) = call.to.call{ value: callValue }(call.data);
        if (!success) revert OperationFailed(string(result));

        // emit the events
        // todo check any other value that should be emitted
        emit OperationSent(msg.sender, partnerId, call.to, operationParams.amountToSend);
    }

    function _validateCall(Call calldata call) internal view {
        if (call.to != address(this)) revert CallToSelf();
    }

    function _validateMsgValue(
        bool opInNative,
        bool opFeeInNative,
        uint256 opTotalAmount,
        uint256 opFeeAmount,
        uint256 callValue
    ) internal view {
        uint256 expectedValue = callValue;
        if (opInNative) expectedValue += opTotalAmount;
        if (opFeeInNative) expectedValue += opFeeAmount;

        if (msg.value < expectedValue) revert InvalidMsgValue(msg.value, expectedValue);
    }

    function _validateSignature(bytes memory payload, bytes calldata signature) internal view {
        if (ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(payload)), signature) == externalSigner)
            revert InvalidSignature();
    }

    function _validateOperationParams(OperationParams calldata operationParams) internal pure {
        if (operationParams.token == address(0)) revert InvalidOperationToken(operationParams.token);
        if (operationParams.ctrAddress == address(0)) revert InvalidOperationCtrAddress(operationParams.ctrAddress);
        if (
            operationParams.totalAmount ==
            operationParams.amountToSend + operationParams.protocolFee + operationParams.partnerFee
        )
            revert InvalidOperationAmounts(
                operationParams.totalAmount,
                operationParams.amountToSend,
                operationParams.protocolFee,
                operationParams.partnerFee
            );
    }
}

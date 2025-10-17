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

    // @dev partnerId = 0 will be used for the protocol fees
    mapping(uint256 partnerId => mapping(address oft => uint256 bps)) public accruedFees;

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
     * !  - Should the partner be able to withdraw their fees?
     * !  - Should the withdrawn fees for paused partner?
     * !  - should allow withdrawing a specific amount of fees?
     * !  - Should the partner be able to withdraw the fees to a specific address?
     * @param partnerId The ID of the partner
     * @dev only the owner can withdraw the fees
     */

    function withdrawPartnerAccruedFees(
        uint256 partnerId,
        address oft
    ) external onlyActivePartner(partnerId) onlyOwner {
        uint256 accruedBps = accruedFees[partnerId][oft];

        if (accruedBps == 0) return;

        accruedFees[partnerId][oft] = 0;
        IERC20(oft).safeTransfer(partners[partnerId].partnerAddress, accruedBps);

        emit PartnerAccruedFeesWithdrawn(partnerId, oft, partners[partnerId].partnerAddress, accruedBps);
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
        GasOperationParams calldata gasOperationParams,
        Call calldata call,
        bytes calldata signature
    ) external payable nonReentrant onlyActivePartner(partnerId) {
        // validations
        bool opInNative = operationParams.token == address(0);
        bool gasOpInNative = gasOperationParams.token == address(0);

        // todo the payload should be all received params encoded together, do any adjustments needed
        _validateSignature(
            abi.encode(address(this), block.chainid, partnerId, operationParams, gasOperationParams, call),
            signature
        );
        _validateOperationParams(operationParams);
        _validateCall(call);
        _validateMsgValue(
            opInNative,
            gasOpInNative,
            operationParams.totalAmount,
            gasOperationParams.amount,
            call.value
        );

        // accumulate the protocol and partner fees
        accruedFees[partnerId][operationParams.token] += operationParams.partnerFee;
        accruedFees[0][operationParams.token] += operationParams.protocolFee;

        // get funds from user to do the operation
        if (!opInNative) {
            IERC20(operationParams.token).safeTransferFrom(msg.sender, address(this), operationParams.totalAmount);

            // approve the contracts to spend the funds
            IERC20(operationParams.token).safeApprove(operationParams.ctrAddress, operationParams.amountToSend);
        }

        if (!gasOpInNative) {
            IERC20(gasOperationParams.token).safeTransferFrom(msg.sender, address(this), gasOperationParams.amount);

            // approve the contracts to spend the funds
            IERC20(gasOperationParams.token).safeApprove(gasOperationParams.ctrAddress, gasOperationParams.amount);
        }

        // do the wrapped operation
        (bool success, bytes memory result) = call.to.call{ value: call.value }(call.data);
        if (!success) revert OperationFailed(string(result));

        // emit the events
        // todo check any other value that should be emitted
        emit OperationSent(msg.sender, partnerId, call.to, operationParams.amountToSend);
        emit WrapperFees(
            partnerId,
            operationParams.token,
            operationParams.partnerFee,
            operationParams.protocolFee,
            gasOperationParams.token,
            gasOperationParams.amount
        );
    }

    function _validateCall(Call calldata call) internal view {
        if (call.to != address(this)) revert CallToSelf();
    }

    function _validateMsgValue(
        bool opInNative,
        bool gasOpInNative,
        uint256 opTotalAmount,
        uint256 gasOpAmount,
        uint256 callValue
    ) internal view {
        uint256 expectedValue = callValue;
        if (opInNative) expectedValue += opTotalAmount;
        if (gasOpInNative) expectedValue += gasOpAmount;

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

    function withdrawPartnerAccruedFees(uint256 partnerId, address oft, address receiver) external override {}
}

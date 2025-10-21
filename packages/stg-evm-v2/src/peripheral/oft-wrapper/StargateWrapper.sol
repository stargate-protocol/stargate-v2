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
    /**
     * @dev send the operation to the target contract
     * @param partnerId The ID of the partner
     * @param operationData The operation data with the call, operation asset information, subsequent call forward token, and protocol and partner fees
     * @param extraFeeParams The extra fee parameters, this is used to pay any extra fees needed (e.g. CCTP auto-claim fees)
     * @param signature The signature of the operation
     */
    function send(
        uint256 partnerId,
        Operation calldata operationData,
        ExtraFeeParams calldata extraFeeParams,
        bytes calldata signature
    ) external payable nonReentrant onlyActivePartner(partnerId) {
        // FeeParams memory feeParams = operation.feeParams;
        CallParams memory call = operationData.call;
        Asset memory op = operationData.op;
        FeeAmounts memory fees = operationData.fees;
        Asset memory forward = operationData.forward;

        // validations
        // todo the payload should be all received params encoded together, do any adjustments needed
        _validateSignature(
            abi.encode(address(this), block.chainid, partnerId, operationData, extraFeeParams),
            signature
        );
        _validateCallParams(call);
        _validateOperationForward(forward);
        _validateMsgValue(op, fees, call.value);
        _validateExtraFeeParams(extraFeeParams);

        // emit the fees for the operation to accumulate the values off-chain
        emit FeesPaid(partnerId, op.token, fees.partnerFee, fees.protocolFee);

        // get funds from user to do the operation
        uint256 callValue = call.value;
        bool approveOpToken;

        if (op.token != address(0)) {
            uint256 totalAmount = op.amount + fees.protocolFee + fees.partnerFee;

            // transfer operation amount to this
            _receiveAsset(Asset(totalAmount, op.token));

            // approve the contracts to spend the funds
            approveOpToken = op.amount > 0;
            if (approveOpToken) IERC20(op.token).safeIncreaseAllowance(call.target, op.amount);
        } else {
            // add the operation amount to the call value if the operation token is native
            callValue += op.amount;
        }

        bool approveForwardToken = forward.amount > 0;
        if (approveForwardToken) {
            // transfer operation forward amount to this

            _receiveAsset(forward);

            // approve the contracts to spend the funds for the target call
            IERC20(forward.token).safeIncreaseAllowance(call.target, forward.amount);
        }

        // receive the extra fees if needed
        if (extraFeeParams.ctrAddress != address(0)) {
            if (extraFeeParams.asset.token != address(0)) _receiveAsset(extraFeeParams.asset);

            // todo how deal with the tokens/ native to a contract address
            // should they be transferred or just approved?
            emit ExtraFeeReceived(extraFeeParams.ctrAddress, extraFeeParams.asset.token, extraFeeParams.asset.amount);
        }

        // do the wrapped operation
        emit OperationSent(msg.sender, partnerId, call.target, op.amount);

        (bool success, bytes memory result) = call.target.call{ value: callValue }(call.data);
        if (!success) revert OperationFailed(string(result));

        // revert allowance for the call target
        if (approveOpToken) IERC20(op.token).safeApprove(call.target, 0);
        if (approveForwardToken) IERC20(forward.token).safeApprove(call.target, 0);
    }

    function _receiveAsset(Asset memory asset) internal {
        IERC20(asset.token).safeTransferFrom(msg.sender, address(this), asset.amount);
    }

    function _validateCallParams(CallParams memory call) internal view {
        if (call.target != address(this)) revert CallToSelf();
    }

    function _validateMsgValue(Asset memory op, FeeAmounts memory fees, uint256 callValue) internal view {
        uint256 expectedValue = callValue;
        if (op.token == address(0)) {
            expectedValue += op.amount + fees.protocolFee + fees.partnerFee;
        }

        if (msg.value < expectedValue) revert InvalidMsgValue(msg.value, expectedValue);
    }

    function _validateSignature(bytes memory payload, bytes memory signature) internal view {
        if (ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(payload)), signature) == externalSigner)
            revert InvalidSignature();
    }

    function _validateOperationForward(Asset memory forward) internal pure {
        if (forward.amount == 0) return;
        // forward token must be set
        if (forward.token == address(0)) revert InvalidOperationForwardToken(forward.token);
    }

    function _validateExtraFeeParams(ExtraFeeParams calldata extraFeeParams) internal pure {
        if (extraFeeParams.asset.amount == 0) return;
        // extra fee contract address must be set
        if (extraFeeParams.ctrAddress == address(0)) revert InvalidExtraFeeCtrAddress(extraFeeParams.ctrAddress);
    }
}

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
        for (uint256 i = 0; i < tokens.length; ++i) {
            IERC20(tokens[i]).safeTransfer(receiver, IERC20(tokens[i]).balanceOf(address(this)));
        }
    }

    // Send
    /**
     * @dev only active partners can send operations
     * ! TBD
     * ! - This assumes the protocol and partner fees are paid in the same operation token, explore the possibility of having different tokens for each fee.
     * ! - I'm decreasing the allowance after the operation call, due to I'm assuming it would be consumed atomically, could there be a case when it's not?
     * ! - Extra fees should be paid instantly or just approved? Check how LZ handles this to pay for the message auto delivery by the executor.
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
        CallParams calldata call = operationData.call;
        Asset calldata op = operationData.op;
        FeeAmounts calldata fees = operationData.fees;
        Asset calldata fwd = operationData.forward;

        // validations
        // todo the payload should be all received params encoded together, do any adjustments needed
        _validateSignature(
            abi.encode(address(this), block.chainid, partnerId, operationData, extraFeeParams),
            signature
        );
        _validateCallParams(call);
        _validateOperationForward(fwd);
        _validateMsgValue(op, fees, call.value);
        _validateExtraFeeParams(extraFeeParams);

        // emit the fees for the operation to accumulate the values off-chain
        emit FeesPaid(partnerId, op.token, fees.partnerFee, fees.protocolFee);

        // gather funds & compute approvals
        address approveToken0; // op token (and maybe fwd merged)
        uint256 approveAmt0;
        address approveToken1; // second token if different
        uint256 approveAmt1;

        uint256 valueToSend = call.value;
        // bool approveOpToken;

        if (op.token != address(0)) {
            // total pull for the op token (op amount + both fees)
            uint256 totalPull = op.amount + fees.protocolFee + fees.partnerFee;

            _receiveAsset(Asset(totalPull, op.token));

            // compute the approvals needed for the operation
            if (op.amount > 0) {
                approveToken0 = op.token;
                approveAmt0 = op.amount;
            }
        } else {
            // Native funding: add to call value
            unchecked {
                valueToSend += op.amount;
            }
        }

        if (fwd.amount > 0) {
            _receiveAsset(fwd);

            // compute the approvals needed for the forward call
            if (approveToken0 == address(0)) {
                approveToken0 = fwd.token;
                approveAmt0 = fwd.amount;
            } else if (fwd.token == approveToken0) {
                approveAmt0 += fwd.amount; // merge approvals
            } else {
                approveToken1 = fwd.token;
                approveAmt1 = fwd.amount;
            }
        }

        // Apply approvals (0–2 calls)
        if (approveAmt0 != 0) IERC20(approveToken0).safeIncreaseAllowance(call.target, approveAmt0);
        if (approveAmt1 != 0) IERC20(approveToken1).safeIncreaseAllowance(call.target, approveAmt1);

        // optional extra fee asset
        if (extraFeeParams.ctrAddress != address(0)) {
            if (extraFeeParams.asset.token != address(0) && extraFeeParams.asset.amount > 0)
                // todo how deal with the tokens/ native to a contract address? should they be transferred or just approved?
                _receiveAsset(extraFeeParams.asset);

            emit ExtraFeeReceived(extraFeeParams.ctrAddress, extraFeeParams.asset.token, extraFeeParams.asset.amount);
        }

        emit OperationSent(msg.sender, partnerId, call.target, op.amount);
        // external call the wrapped operation
        (bool ok, bytes memory result) = call.target.call{ value: valueToSend }(call.data);
        if (!ok) {
            // Bubble exact reason (cheaper than string(result))
            assembly {
                revert(add(result, 0x20), mload(result))
            }
        }

        // reset allowances only if set
        if (approveAmt0 != 0) IERC20(approveToken0).forceApprove(call.target, 0);
        if (approveAmt1 != 0) IERC20(approveToken1).forceApprove(call.target, 0);
    }

    function _receiveAsset(Asset memory asset) internal {
        IERC20(asset.token).safeTransferFrom(msg.sender, address(this), asset.amount);
    }

    function _validateCallParams(CallParams calldata call) internal view {
        if (call.target != address(this)) revert CallToSelf();
    }

    function _validateMsgValue(Asset calldata op, FeeAmounts calldata fees, uint256 callValue) internal view {
        uint256 expectedValue = callValue;
        if (op.token == address(0)) {
            expectedValue += op.amount + fees.protocolFee + fees.partnerFee;
        }

        if (msg.value < expectedValue) revert InvalidMsgValue(msg.value, expectedValue);
    }

    function _validateSignature(bytes memory payload, bytes calldata signature) internal view {
        if (ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(payload)), signature) == externalSigner)
            revert InvalidSignature();
    }

    function _validateOperationForward(Asset calldata forward) internal pure {
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

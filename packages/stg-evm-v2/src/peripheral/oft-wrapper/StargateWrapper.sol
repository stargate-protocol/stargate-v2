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

    modifier onlyActivePartner(uint256 partnerId) {
        _onlyActivePartner(partnerId);
        _;
    }

    constructor(address owner_) {
        _transferOwnership(owner_);
    }

    receive() external payable {}

    // ------------------ Admin ------------------
    function setExternalSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidZeroAddress();
        address old = externalSigner;
        externalSigner = newSigner;
        emit ExternalSignerUpdated(old, newSigner);
    }

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
        uint256 len = tokens.length;
        for (uint256 i; i < len; ++i) {
            address t = tokens[i];
            IERC20(t).safeTransfer(receiver, IERC20(t).balanceOf(address(this)));
        }
    }

    function sweepETH(address payable receiver) external onlyOwner {
        (bool ok, bytes memory result) = receiver.call{ value: address(this).balance }("");
        if (!ok) {
            assembly {
                revert(add(result, 0x20), mload(result))
            }
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
     * @param operationData The operation data with: the call, operation asset information, subsequent call forward asset information, and protocol and partner fees
     * @param extraFeeParams The extra fee parameters, this is used to pay any extra fees needed (e.g. CCTP auto-claim fees)
     * @param signature The external signer signature for the operation
     */
    function send(
        uint256 partnerId,
        Operation calldata operationData,
        ExtraFeeParams calldata extraFeeParams,
        bytes calldata signature
    ) external payable nonReentrant onlyActivePartner(partnerId) {
        CallParams calldata call = operationData.call;
        Asset calldata opAsset = operationData.opAsset;
        FeeAmounts calldata fees = operationData.fees;
        Asset calldata fwdCallAsset = operationData.forwardAsset;

        // validations
        // todo the payload should be all received params encoded together, do any adjustments needed
        bytes32 digest = keccak256(abi.encode(address(this), block.chainid, partnerId, operationData, extraFeeParams));
        _validateSignature(digest, signature);
        _validateCallParams(call);
        _validateOperationForwardCall(fwdCallAsset);
        _validateMsgValue(opAsset, fees, call.value);
        _validateExtraFeeParams(extraFeeParams);

        // emit the fees for the operation to accumulate the values off-chain
        emit FeesPaid(partnerId, opAsset.token, fees.partnerFee, fees.protocolFee);

        // gather pull tokens amounts & approvals
        (AssetAllocation memory asset0, AssetAllocation memory asset1, uint256 callValue) = _calculatePullAndApproveAmt(
            opAsset,
            fwdCallAsset,
            fees
        );

        // add the call value to the amount calculated for the call target
        callValue += call.value;

        // receive the assets
        if (asset0.pullAmt > 0) _receiveAsset(asset0.token, asset0.pullAmt);
        if (asset1.pullAmt > 0) _receiveAsset(asset1.token, asset1.pullAmt);

        // apply approvals (0–2 calls)
        if (asset0.approveAmt != 0) IERC20(asset0.token).forceApprove(call.target, asset0.approveAmt);
        if (asset1.approveAmt != 0) IERC20(asset1.token).forceApprove(call.target, asset1.approveAmt);

        // optional extra fee asset
        if (extraFeeParams.ctrAddress != address(0)) {
            if (extraFeeParams.asset.token != address(0) && extraFeeParams.asset.amount > 0)
                // todo how deal with the tokens/ native to a contract address? should they be transferred or just approved?
                _receiveAsset(extraFeeParams.asset.token, extraFeeParams.asset.amount);

            emit ExtraFeeReceived(extraFeeParams.ctrAddress, extraFeeParams.asset.token, extraFeeParams.asset.amount);
        }

        // execute wrapped operation
        emit OperationSent(msg.sender, partnerId, call.target, opAsset.amount);
        (bool ok, bytes memory result) = call.target.call{ value: callValue }(call.data);
        if (!ok) {
            // Bubble exact reason (cheaper than string(result))
            assembly {
                revert(add(result, 0x20), mload(result))
            }
        }

        // reset allowances only if set
        if (asset0.approveAmt != 0) IERC20(asset0.token).forceApprove(call.target, 0);
        if (asset1.approveAmt != 0) IERC20(asset1.token).forceApprove(call.target, 0);
    }

    function _receiveAsset(address token, uint256 amount) internal {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function _validateCallParams(CallParams calldata call) internal view {
        // forbid calling this wrapper itself and the zero address
        if (call.target == address(this)) revert CallToSelf();
        if (call.target == address(0)) revert InvalidZeroAddress();
    }

    function _validateMsgValue(Asset calldata op, FeeAmounts calldata fees, uint256 callValue) internal view {
        uint256 expectedValue = callValue;
        if (op.token == address(0)) {
            expectedValue += op.amount + fees.protocolFee + fees.partnerFee;
        }

        if (msg.value < expectedValue) revert InvalidMsgValue(msg.value, expectedValue);
    }

    function _validateSignature(bytes32 digest, bytes calldata signature) internal view {
        if (ECDSA.recover(ECDSA.toEthSignedMessageHash(digest), signature) != externalSigner) revert InvalidSignature();
    }

    function _validateOperationForwardCall(Asset calldata forward) internal pure {
        if (forward.token == address(0)) return;
        // if the forward token is set, the amount must be greater than 0
        if (forward.amount == 0) revert InvalidOperationForwardAmount(forward.amount);
    }

    function _validateExtraFeeParams(ExtraFeeParams calldata extraFeeParams) internal pure {
        if (extraFeeParams.asset.amount == 0) return;
        // extra fee contract address must be set
        if (extraFeeParams.ctrAddress == address(0)) revert InvalidExtraFeeCtrAddress(extraFeeParams.ctrAddress);
    }

    // @devs token0 will be the op token, and maybe fwd call asset if both are the same token
    //       token1 will be the forward call asset token if different
    //       callValue will be the value to send to the call target
    function _calculatePullAndApproveAmt(
        Asset calldata opAsset,
        Asset calldata fwdCallAsset,
        FeeAmounts calldata fees
    ) internal pure returns (AssetAllocation memory token0, AssetAllocation memory token1, uint256 callValue) {
        // op asset
        uint256 opPull = opAsset.amount + fees.protocolFee + fees.partnerFee;
        if (opAsset.token != address(0)) {
            // Pull tokens (op amount + fees). Only approve the op amount.
            if (opPull > 0) {
                token0.token = opAsset.token;
                token0.pullAmt = opPull;
                token0.approveAmt = opAsset.amount;
            }
        } else {
            // Native funding: add to call value (only the op asset amount since the fees should be kept on the wrapper)
            callValue += opAsset.amount;
        }

        // fwd call asset
        if (fwdCallAsset.amount > 0) {
            if (fwdCallAsset.token == address(0)) {
                // Native funding
                callValue += fwdCallAsset.amount;
            } else {
                // ERC20 forward asset
                if (token0.token == fwdCallAsset.token) {
                    // same token: merge approvals and pull amounts
                    token0.approveAmt += fwdCallAsset.amount;
                    token0.pullAmt += fwdCallAsset.amount;
                } else if (token0.token == address(0)) {
                    // token0 unused so far: take it
                    token0.token = fwdCallAsset.token;
                    token0.approveAmt = fwdCallAsset.amount;
                    token0.pullAmt = fwdCallAsset.amount;
                } else {
                    // different token: use token1
                    token1.token = fwdCallAsset.token;
                    token1.approveAmt = fwdCallAsset.amount;
                    token1.pullAmt = fwdCallAsset.amount;
                }
            }
        }
    }

    function _onlyActivePartner(uint256 partnerId) internal view {
        if (!partners[partnerId].isActive) revert PartnerNotActive(partnerId);
    }
}

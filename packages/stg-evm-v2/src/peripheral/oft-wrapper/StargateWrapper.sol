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

    uint256 public constant BPS_DENOMINATOR = 10_000;
    address public constant NOT_PARTNER_ADDRESS = address(1);

    // ! could make sense to have a list of allowed signers? in case we want more than one api using the same wrapper?
    // ! note this will need a more careful maintenance of the signers list since old one should be disabled/removed
    address public externalSigner;

    // Protocol fee
    uint256 public defaultBPS;
    mapping(address ctrAddress => uint256 bps) public specificBPS;

    // Partners
    mapping(uint256 partnerId => Partner partner) public partners;

    // @dev partnerId = 0 will be used for the protocol fees
    mapping(uint256 partnerId => mapping(address oft => uint256 bps)) public accruedFees;

    constructor(uint256 defaultBPS_, address owner_) {
        defaultBPS = defaultBPS_;
        _transferOwnership(owner_);
    }

    modifier onlyActivePartner(uint256 partnerId) {
        if (!partners[partnerId].isActive) revert PartnerNotActive(partnerId);
        _;
    }

    // BPS fees
    function setDefaultBPS(uint256 defaultBPS_) external onlyOwner {
        defaultBPS = defaultBPS_;

        emit ProtocolDefaultBpsSet(defaultBPS);
    }

    function setBpsByOFT(address oft, uint256 bps) external onlyOwner {
        specificBPS[oft] = bps;

        emit ProtocolBpsByOFTSet(oft, bps);
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

    function withdrawPartnerAccruedFees(
        uint256 partnerId,
        address oft,
        address receiver
    ) external onlyActivePartner(partnerId) {
        // check if the caller is authorized to withdraw
        address authorizedWithdrawAddress = partners[partnerId].partnerAddress;
        if (authorizedWithdrawAddress == NOT_PARTNER_ADDRESS) {
            // if there is no authorized withdraw address, only the protocol owner can withdraw
            if (msg.sender != owner()) revert WithdrawNotAuthorized(partnerId, msg.sender);
        } else {
            if (msg.sender != authorizedWithdrawAddress) revert WithdrawNotAuthorized(partnerId, msg.sender);
        }

        // ! should allow withdrawing an specific amount of accruedFees?
        uint256 accruedBps = accruedFees[partnerId][oft];
        if (accruedBps == 0) return;

        accruedFees[partnerId][oft] = 0;
        IERC20(oft).safeTransfer(receiver, accruedBps);

        emit PartnerAccruedFeesWithdrawn(partnerId, oft, receiver, accruedBps);
    }

    function sweep(address receiver, address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).safeTransfer(receiver, IERC20(tokens[i]).balanceOf(address(this)));
        }
    }

    // Send
    function sendErc20(
        PartnerFee calldata partnerFee,
        OperationParams calldata operationParams,
        GasOperationParams calldata gasOperationParams,
        Call calldata call,
        bytes calldata signature
    ) external payable nonReentrant {
        _validateCall(call);
        // todo the payload should be all received params encoded together, do any adjustments needed?
        _validateSignature(
            abi.encode(address(this), block.chainid, partnerFee, operationParams, gasOperationParams, call),
            signature
        );
        _validateOperationParams(operationParams);

        // partner fee and protocol fee
        _validateFee(partnerFee.bps, operationParams.amountToSend, operationParams.partnerFee);
        uint256 protocolBPS = specificBPS[operationParams.token];
        if (protocolBPS == 0) protocolBPS = defaultBPS;
        _validateFee(protocolBPS, operationParams.amountToSend, operationParams.protocolFee);

        // accumulate the partner and protocol fees
        accruedFees[partnerFee.partnerId][operationParams.token] += operationParams.partnerFee;
        accruedFees[0][operationParams.token] += operationParams.protocolFee;

        emit OperationSent(
            msg.sender,
            operationParams.partnerFee,
            operationParams.protocolFee,
            operationParams.token,
            msg.value - call.value
        );

        emit WrapperFees(
            partnerFee.partnerId,
            operationParams.token,
            operationParams.partnerFee,
            operationParams.protocolFee
        );

        // get the funds from the user to do the operation
        IERC20(operationParams.token).safeTransferFrom(msg.sender, address(this), operationParams.amountToSend);
        if (gasOperationParams.token != address(0)) {
            // if the gas must be payed in ERC20
            IERC20(gasOperationParams.token).safeTransferFrom(msg.sender, address(this), gasOperationParams.amount);
        }

        IERC20(operationParams.token).safeApprove(operationParams.ctrAddress, operationParams.amountToSend);
        IERC20(gasOperationParams.token).safeApprove(gasOperationParams.ctrAddress, gasOperationParams.amount);

        (bool success, bytes memory result) = call.to.call{ value: call.value }(call.data);

        if (!success) revert OperationFailed(string(result));

        // ! is this needed?
        IERC20(operationParams.token).safeApprove(operationParams.ctrAddress, 0);
        IERC20(gasOperationParams.token).safeApprove(gasOperationParams.ctrAddress, 0);
    }

    function sendNative(
        PartnerFee calldata partnerFee,
        OperationParams calldata operationParams,
        // ! it is not using the gasOperationParams but I think it might be still needed (e.x the fees are payed in LZ token)
        GasOperationParams calldata gasOperationParams,
        Call calldata call,
        bytes calldata signature
    ) external payable nonReentrant {
        // todo
    }

    function _validateCall(Call calldata call) internal view {
        if (call.to != address(this)) revert CallToSelf();
        if (msg.value >= call.value) revert InvalidMsgValue(msg.value, call.value);
    }

    function _validateSignature(bytes memory payload, bytes calldata signature) internal view {
        if (ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(payload)), signature) == externalSigner)
            revert InvalidSignature();
    }

    function _validateOperationParams(OperationParams calldata operationParams) internal pure {
        /**
         * todo validate operation params
         * todo validate the contracts addresses is not zero
         * todo validate the amount in operation is not zero
         * ...
         *
         * */
    }

    function _validateFee(uint256 bps, uint256 amount, uint256 feeAmount) internal pure {
        uint256 calculatedFee = (amount * bps) / BPS_DENOMINATOR;
        if (calculatedFee != feeAmount) revert InvalidFee(calculatedFee, feeAmount);
    }
}

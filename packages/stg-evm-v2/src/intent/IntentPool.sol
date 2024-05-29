// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { ISignatureTransfer } from "../interfaces/permit2/IPermit2.sol";
import { IStargatePool } from "../interfaces/IStargatePool.sol";
import { Transfer } from "../libs/Transfer.sol";
import { IntentBase } from "./IntentBase.sol";

contract IntentPool is IntentBase {
    bytes private constant INTENT_REDEEM_TYPE =
        abi.encodePacked(
            "IntentRedeem(",
            "address owner,",
            "address receiver,",
            "uint256 amountLD,",
            "uint256 minAmountLD,",
            "uint256 nonce,",
            "uint256 deadline)"
        );
    bytes32 private constant INTENT_REDEEM_TYPE_HASH = keccak256(INTENT_REDEEM_TYPE);
    string private constant INTENT_REDEEM_PERMIT2_TYPE =
        string(abi.encodePacked("IntentRedeem witness)", INTENT_REDEEM_TYPE, TOKEN_PERMISSIONS_TYPE));

    address public immutable lpToken;

    error Intent_RedeemNotFull();
    error Intent_SlippageTooHigh();

    event IntentRedeemed(address indexed owner, address indexed receiver, uint256 amountLD);

    // the witness struct for permit2
    struct IntentRedeem {
        address owner;
        address receiver;
        uint256 amountLD;
        uint256 minAmountLD;
        uint256 nonce;
        uint256 deadline;
    }

    constructor(address _stargate, address _permit2) IntentBase(_stargate, _permit2) {
        lpToken = IStargatePool(_stargate).lpToken();
    }

    function redeem(
        IntentRedeem calldata _intentRedeem,
        bytes calldata _signature,
        uint256 _intentFee
    ) external onlyOwner {
        _permitWitnessTransferFrom(_intentRedeem, _signature);

        uint256 amountLD = IStargatePool(stargate).redeem(_intentRedeem.amountLD, address(this));
        if (amountLD != _intentRedeem.amountLD) revert Intent_RedeemNotFull();

        // pay intent fee
        amountLD -= _intentFee;
        if (amountLD < _intentRedeem.minAmountLD) revert Intent_SlippageTooHigh();

        //        _transfer(token, _intentRedeem.receiver, amountLD);
        Transfer.transferToken(token, _intentRedeem.receiver, amountLD);
        emit IntentRedeemed(_intentRedeem.owner, _intentRedeem.receiver, amountLD);
    }

    function _permitWitnessTransferFrom(IntentRedeem calldata _intentRedeem, bytes calldata _signature) internal {
        // check signature and transfer token from sender
        ISignatureTransfer.PermitTransferFrom memory permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({ token: lpToken, amount: _intentRedeem.amountLD }),
            nonce: _intentRedeem.nonce,
            deadline: _intentRedeem.deadline
        });
        ISignatureTransfer.SignatureTransferDetails memory transfer = ISignatureTransfer.SignatureTransferDetails({
            to: address(this),
            requestedAmount: _intentRedeem.amountLD
        });
        permit2.permitWitnessTransferFrom(
            permit,
            transfer,
            _intentRedeem.owner,
            _hashIntentRedeem(_intentRedeem),
            INTENT_REDEEM_PERMIT2_TYPE,
            _signature
        );
    }

    function _hashIntentRedeem(IntentRedeem calldata _intentRedeem) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    INTENT_REDEEM_TYPE_HASH,
                    _intentRedeem.owner,
                    _intentRedeem.receiver,
                    _intentRedeem.amountLD,
                    _intentRedeem.minAmountLD,
                    _intentRedeem.nonce,
                    _intentRedeem.deadline
                )
            );
    }
}

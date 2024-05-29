// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { SendParam, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

import { IStargate } from "../interfaces/IStargate.sol";
import { IPermit2, ISignatureTransfer } from "../interfaces/permit2/IPermit2.sol";
import { Transfer } from "../libs/Transfer.sol";

abstract contract IntentBase is Transfer {
    string internal constant TOKEN_PERMISSIONS_TYPE = "TokenPermissions(address token,uint256 amount)";
    bytes private constant INTENT_SEND_TYPE =
        abi.encodePacked(
            "IntentSend(",
            "address sender,",
            "uint32 dstEid,",
            "bytes32 to,",
            "uint256 amountLD,",
            "uint256 minAmountLD,",
            "uint256 nonce,",
            "uint256 deadline)"
        );
    bytes32 private constant INTENT_SEND_TYPE_HASH = keccak256(INTENT_SEND_TYPE);
    string private constant INTENT_SEND_PERMIT2_TYPE =
        string(abi.encodePacked("IntentSend witness)", INTENT_SEND_TYPE, TOKEN_PERMISSIONS_TYPE));

    address public immutable stargate;
    address public immutable token;
    IPermit2 public immutable permit2;

    // the witness struct for permit2
    struct IntentSend {
        address sender;
        uint32 dstEid;
        bytes32 to;
        uint256 amountLD;
        uint256 minAmountLD;
        uint256 nonce;
        uint256 deadline;
    }

    event IntentSent(address indexed sender, uint32 indexed dstEid, bytes32 to, uint256 amountLD);

    constructor(address _stargate, address _permit2) {
        stargate = _stargate;
        token = IStargate(_stargate).token();
        permit2 = IPermit2(_permit2);
        _tokenApprove();
    }

    function withdrawFee(address _token, address _to, uint256 _amount) external onlyOwner {
        Transfer.transfer(_token, _to, _amount, false);
    }

    /// @dev get signature w/ the permit2 sdk https://github.com/Uniswap/permit2-sdk/blob/main/src/signatureTransfer.ts
    function send(
        IntentSend calldata _intentSend,
        bytes calldata _oftCmd,
        bytes calldata _signature,
        uint256 _intentFee,
        address _refundAddress
    ) external payable onlyOwner {
        _permitWitnessTransferFrom(_intentSend, _signature);
        _send(_intentSend, _oftCmd, _intentFee, _refundAddress);
        emit IntentSent(_intentSend.sender, _intentSend.dstEid, _intentSend.to, _intentSend.amountLD);
    }

    function _send(
        IntentSend calldata _intentSend,
        bytes calldata _oftCmd,
        uint256 _intentFee,
        address _refundAddress
    ) internal virtual {
        uint256 nativeFee = msg.value;
        uint256 amountIn = _intentSend.amountLD - _intentFee; // after paying intent fee
        uint256 msgValue = _getMsgValue(nativeFee, amountIn);
        IStargate(stargate).send{ value: msgValue }(
            SendParam({
                dstEid: _intentSend.dstEid,
                to: _intentSend.to,
                amountLD: amountIn,
                minAmountLD: _intentSend.minAmountLD,
                extraOptions: "",
                composeMsg: "", // not allowed to compose
                oftCmd: _oftCmd
            }),
            MessagingFee(nativeFee, 0),
            _refundAddress
        );
    }

    function _permitWitnessTransferFrom(IntentSend calldata _intentSend, bytes calldata _signature) internal {
        // check signature and transfer token from sender
        ISignatureTransfer.PermitTransferFrom memory permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({ token: _intentSendToken(), amount: _intentSend.amountLD }),
            nonce: _intentSend.nonce,
            deadline: _intentSend.deadline
        });
        ISignatureTransfer.SignatureTransferDetails memory transfer = ISignatureTransfer.SignatureTransferDetails({
            to: address(this),
            requestedAmount: _intentSend.amountLD
        });
        permit2.permitWitnessTransferFrom(
            permit,
            transfer,
            _intentSend.sender,
            _hashIntentSend(_intentSend),
            INTENT_SEND_PERMIT2_TYPE,
            _signature
        );
    }

    function _hashIntentSend(IntentSend calldata _intentSend) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    INTENT_SEND_TYPE_HASH,
                    _intentSend.sender,
                    _intentSend.dstEid,
                    _intentSend.to,
                    _intentSend.amountLD,
                    _intentSend.minAmountLD,
                    _intentSend.nonce,
                    _intentSend.deadline
                )
            );
    }

    /// @dev The msgValue is only for the native messaging fee by default
    function _getMsgValue(uint256 _nativeFee, uint256 /*_amountIn*/) internal pure virtual returns (uint256) {
        return _nativeFee;
    }

    /// @dev get the token address for intent send
    function _intentSendToken() internal view virtual returns (address) {
        return token;
    }

    function _tokenApprove() internal virtual {
        Transfer.safeApproveToken(token, address(stargate), type(uint256).max);
    }
}

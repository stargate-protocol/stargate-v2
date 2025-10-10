// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IStargateWrapper {
    struct Partner {
        bool isActive;
        address partnerAddress;
    }

    struct Call {
        address to;
        uint256 value;
        bytes data;
    }

    struct OperationParams {
        uint256 protocolFee;
        uint256 partnerFee;
        uint256 amountToSend;
        address ctrAddress;
        address token;
    }

    struct GasOperationParams {
        uint256 amount;
        address ctrAddress;
        address token;
    }

    struct PartnerFee {
        uint256 partnerId;
        uint256 bps;
        address ctrAddress;
    }

    /// ===============================================
    ///                      ERRORS
    /// ===============================================
    error InvalidZeroAddress();
    error InvalidZeroPartnerId();
    error InvalidSignature();
    error InvalidFee(uint256 expectedFee, uint256 receivedFee);
    error InvalidOperationParams(uint256 total, uint256 amount);
    error InvalidMsgValue(uint256 msgValue, uint256 callValue);

    error PartnerNotRegistered(uint256 partnerId);
    error PartnerAlreadyRegistered(uint256 partnerId);
    error PartnerNotActive(uint256 partnerId);

    error CallToSelf();
    error OperationFailed(string reason);
    error WithdrawNotAuthorized(uint256 partnerId, address caller);

    /// ===============================================
    ///                      EVENTS
    /// ===============================================
    event ProtocolDefaultBpsSet(uint256 defaultBps);
    event ProtocolBpsByOFTSet(address oft, uint256 bps);

    event PartnerSet(uint256 partnerId, address withdrawAddress);
    event PartnerAccruedFeesWithdrawn(uint256 partnerId, address oft, address receiver, uint256 accruedFees);
    event PartnerPaused(uint256 partnerId);

    event OperationSent(address from, uint256 partnerFee, uint256 protocolFee, address feeToken, uint256 nativeFee);
    event WrapperFees(uint256 indexed partnerId, address indexed feeToken, uint256 partnerFee, uint256 protocolFee);

    // admin functions
    function setDefaultBPS(uint256 defaultBPS_) external;

    function setBpsByOFT(address oft, uint256 bps) external;

    function setPartner(uint256 partnerId, address partnerAddress) external;

    function sweep(address receiver, address[] calldata tokens) external;

    // partner functions
    function withdrawPartnerAccruedFees(uint256 partnerId, address oft, address receiver) external;

    // send functions
    function sendErc20(
        PartnerFee calldata partnerFee,
        OperationParams calldata operationParams,
        GasOperationParams calldata gasOperationParams,
        Call calldata call,
        bytes calldata signature
    ) external payable;

    function sendNative(
        PartnerFee calldata partnerFee,
        OperationParams calldata operationParams,
        GasOperationParams calldata gasOperationParams,
        Call calldata call,
        bytes calldata signature
    ) external payable;
}

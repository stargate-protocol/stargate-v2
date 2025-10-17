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
        uint256 totalAmount;
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

    /// ===============================================
    ///                      ERRORS
    /// ===============================================
    error InvalidZeroAddress();
    error InvalidZeroPartnerId();
    error InvalidSignature();
    error InvalidOperationAmounts(uint256 total, uint256 amountToSend, uint256 protocolFee, uint256 partnerFee);
    error InvalidOperationToken(address token);
    error InvalidOperationCtrAddress(address ctrAddress);
    error InvalidMsgValue(uint256 msgValue, uint256 callValue);

    error PartnerNotActive(uint256 partnerId);

    error CallToSelf();
    error OperationFailed(string reason);

    /// ===============================================
    ///                      EVENTS
    /// ===============================================
    event PartnerSet(uint256 partnerId, address withdrawAddress);
    event PartnerAccruedFeesWithdrawn(uint256 partnerId, address oft, address receiver, uint256 accruedFees);
    event PartnerPaused(uint256 partnerId);

    event OperationSent(address from, uint256 indexed partnerId, address indexed to, uint256 amount);
    event WrapperFees(
        uint256 indexed partnerId,
        address indexed feeToken,
        uint256 partnerFee,
        uint256 protocolFee,
        address indexed gasToken,
        uint256 gasFee
    );

    // admin functions
    function setPartner(uint256 partnerId, address partnerAddress) external;

    function sweep(address receiver, address[] calldata tokens) external;

    // partner functions
    function withdrawPartnerAccruedFees(uint256 partnerId, address oft, address receiver) external;

    // send functions
    function send(
        uint256 partnerId,
        OperationParams calldata operationParams,
        GasOperationParams calldata gasOperationParams,
        Call calldata call,
        bytes calldata signature
    ) external payable;
}

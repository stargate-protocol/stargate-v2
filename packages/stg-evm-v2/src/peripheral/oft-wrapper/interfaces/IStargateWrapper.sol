// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IStargateWrapper {
    struct Partner {
        bool isActive;
        address partnerAddress;
    }

    /**
     * @dev Operation is the main struct for the operation
     * @param call The call parameters for the operation call
     * @param opAsset The asset and amount needed for the operation
     * @param forwardAsset The asset and amount needed for the forward call to do the operation
     * @param fees The fee amounts for the protocol and partner
     */
    struct Operation {
        CallParams call;
        Asset opAsset;
        Asset forwardAsset;
        FeeAmounts fees;
    }

    /**
     * @dev Asset is the asset and amount needed
     * @param amount The amount of the asset
     * @param token The token address
     */
    struct Asset {
        address token;
        uint256 amount;
    }

    /**
     * @dev CallParams is the call parameters for the subsequent call
     * @param target The target address of the call
     * @param value The value of the call
     * @param data The data of the call
     */
    struct CallParams {
        address target;
        uint256 value;
        bytes data;
    }

    /**
     * @dev FeeAmounts is the fee amounts for the protocol and partner
     * @param protocolFee The fee amount for the protocol in absolute value (not bps)
     * @param partnerFee The fee amount for the partner in absolute value (not bps)
     */
    struct FeeAmounts {
        uint256 protocolFee;
        uint256 partnerFee;
        // ! should be allowed to have different tokens for each fee
    }

    /**
     * @dev ExtraFeeParams is the extra fee parameters for any extra charges that need to be paid
     * @param ctrAddress The address of the contract to receive the fee
     * @param asset The asset and amount needed for the fee
     */
    struct ExtraFeeParams {
        address ctrAddress;
        Asset asset;
    }

    struct AssetAllocation {
        address token;
        uint256 approveAmt;
        uint256 pullAmt;
    }

    /// ===============================================
    ///                      ERRORS
    /// ===============================================
    error InvalidZeroAddress();
    error InvalidZeroPartnerId();
    error InvalidSignature();
    error InvalidExtraFeeCtrAddress(address ctrAddress);
    error InvalidOperationForwardAmount(uint256 amount);
    error InvalidMsgValue(uint256 msgValue, uint256 callValue);

    error PartnerNotActive(uint256 partnerId);

    error CallToSelf();

    /// ===============================================
    ///                      EVENTS
    /// ===============================================
    event ExternalSignerUpdated(address indexed oldSigner, address indexed newSigner);

    event PartnerSet(uint256 partnerId, address withdrawAddress);
    event PartnerFeesWithdrawn(uint256 partnerId, address oft, address receiver, uint256 accruedFees);
    event PartnerPaused(uint256 partnerId);

    event OperationSent(address from, uint256 indexed partnerId, address indexed to, uint256 amount);
    event FeesPaid(uint256 indexed partnerId, address indexed feeToken, uint256 partnerFee, uint256 protocolFee);

    event ExtraFeeReceived(address indexed ctrAddress, address indexed token, uint256 amount);

    // admin functions
    function setPartner(uint256 partnerId, address partnerAddress) external;

    function sweep(address receiver, address[] calldata tokens) external;

    // partner functions
    function withdrawPartnerFees(uint256 partnerId, address token, uint256 amount) external;

    // send functions
    function send(
        uint256 partnerId,
        Operation calldata operationData,
        ExtraFeeParams calldata extraFeeParams,
        bytes calldata signature
    ) external payable;
}

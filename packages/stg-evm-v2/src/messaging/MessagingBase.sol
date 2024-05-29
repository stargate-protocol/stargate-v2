// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { OApp, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OAppPreCrimeSimulator } from "@layerzerolabs/lz-evm-oapp-v2/contracts/precrime/OAppPreCrimeSimulator.sol";

abstract contract MessagingBase is OApp, OAppPreCrimeSimulator {
    // max asset id, for the off-chain to get the range of asset id and get the list of stargate impls
    uint16 public maxAssetId;
    mapping(address stargateImpl => uint16 assetId) public assetIds;
    mapping(uint16 assetId => address stargateImpl) public stargateImpls;

    address public planner;

    event AssetIdSet(address stargateImpl, uint16 assetId);
    event MaxAssetIdSet(uint16 maxAssetId);
    event PlannerSet(address planner);

    error Messaging_Unauthorized();
    error Messaging_Unavailable();
    error Messaging_InvalidAssetId();

    modifier onlyPlanner() {
        if (msg.sender != planner) revert Messaging_Unauthorized();
        _;
    }

    constructor(address _endpoint, address _owner) OApp(_endpoint, _owner) {}

    // ---------------------------------- Only Owner ------------------------------------------

    function setAssetId(address _stargateImpl, uint16 _assetId) external onlyOwner {
        if (_assetId == 0) revert Messaging_InvalidAssetId();
        if (_assetId > maxAssetId) {
            maxAssetId = _assetId;
            emit MaxAssetIdSet(_assetId);
        }

        // clean up the old stargate
        uint16 oldAssetId = assetIds[_stargateImpl];
        address oldStargateImpl = stargateImpls[_assetId];
        if (oldAssetId != 0) delete stargateImpls[oldAssetId];
        if (oldStargateImpl != address(0)) delete assetIds[oldStargateImpl];

        // if stargateImpl is address(0) then delete stargateImpls[_assetId]
        if (_stargateImpl == address(0)) {
            delete stargateImpls[_assetId];
        } else {
            // set the new stargate
            assetIds[_stargateImpl] = _assetId;
            stargateImpls[_assetId] = _stargateImpl;
        }
        emit AssetIdSet(_stargateImpl, _assetId);
    }

    /// @dev Update the max asset id manually if it is not set correctly
    function setMaxAssetId(uint16 _maxAssetId) external onlyOwner {
        maxAssetId = _maxAssetId;
        emit MaxAssetIdSet(_maxAssetId);
    }

    function setPlanner(address _planner) external onlyOwner {
        planner = _planner;
        emit PlannerSet(_planner);
    }

    // ---------------------------------- Internal Functions ------------------------------------------

    function _safeGetStargateImpl(uint16 _assetId) internal view returns (address stargate) {
        stargate = stargateImpls[_assetId];
        if (stargate == address(0)) revert Messaging_Unavailable();
    }

    function _safeGetAssetId(address _stargateImpl) internal view returns (uint16 assetId) {
        assetId = assetIds[_stargateImpl];
        if (assetId == 0) revert Messaging_Unavailable();
    }

    /// @dev Lz token is payed in the stargate contract and do nothing here.
    /// Function meant to be overridden
    // solhint-disable-next-line no-empty-blocks
    function _payLzToken(uint256 /*_lzTokenFee*/) internal pure override {}

    // ---------------------------------- PreCrime Functions ------------------------------------------
    function _lzReceiveSimulate(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        _lzReceive(_origin, _guid, _message, _executor, _extraData);
    }

    function isPeer(uint32 _eid, bytes32 _peer) public view override returns (bool) {
        return _peer == peers[_eid];
    }
}

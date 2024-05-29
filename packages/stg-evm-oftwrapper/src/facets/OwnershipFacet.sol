// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { IERC173 } from "../interfaces/IERC173.sol";

/// @title Facet to manage the diamonds ownership
contract OwnershipFacet is IERC173 {
    /// @notice Transfer the ownership to a new owner
    /// @param _newOwner The new owner of the diamond
    function transferOwnership(address _newOwner) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setContractOwner(_newOwner);
    }

    /// @notice Get the current owner
    /// @return owner_ The current owner
    function owner() external view override returns (address owner_) {
        owner_ = LibDiamond.contractOwner();
    }
}

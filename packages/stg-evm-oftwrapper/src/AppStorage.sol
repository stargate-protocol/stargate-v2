// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct FacetAddressAndSelectorPosition {
    address facetAddress;
    uint16 selectorPosition;
}

struct AppStorage {
    // Diamond facets
    mapping(bytes4 => FacetAddressAndSelectorPosition) facetAddressAndSelectorPosition;
    bytes4[] selectors;
    // Ownership facet
    address contractOwner;
    // OFT facets
    uint256 defaultBps;
    mapping(address => uint256) oftBps;
}

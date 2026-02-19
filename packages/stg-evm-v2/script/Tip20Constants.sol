// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

struct Tip20Config {
    string name;
    string symbol;
    string currency;
    address quote;
    bytes32 salt;
}

library Tip20AssetsConfig {
    address public constant PATH_USD = 0x20C0000000000000000000000000000000000000;

    function load(string memory asset) internal pure returns (Tip20Config memory) {
        if (keccak256(bytes(asset)) == keccak256(bytes("usdc"))) {
            return
                Tip20Config({
                    name: "Bridged USDC (Stargate)",
                    symbol: "USDC.e",
                    currency: "USD",
                    quote: PATH_USD,
                    salt: keccak256(bytes("Stargate Bridged USDC.e"))
                });
        }
        if (keccak256(bytes(asset)) == keccak256(bytes("eurc"))) {
            return
                Tip20Config({
                    name: "Bridged EURC (Stargate)",
                    symbol: "EURC.e",
                    currency: "EUR",
                    quote: PATH_USD,
                    salt: keccak256(bytes("Stargate Bridged EURC.e"))
                });
        }
        revert("Invalid asset");
    }
}

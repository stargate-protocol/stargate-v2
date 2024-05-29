// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

library PseudoRandom {
    address internal constant MAX_EVM_ADDRESS = address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF);

    /// @dev generate a pseudo-random number between [1, max] for testing purposes only
    /// @param _seed the seed for generating random numbers
    /// @param _max the maximum value to generate (inclusive)
    /// @return a pseudo-random number between [1, max]
    function random(uint256 _seed, uint256 _max) internal view returns (uint256) {
        return random(_seed, _max, 1);
    }

    /// @dev generate a pseudo-random number between [offset, max + offset) for testing purposes only
    /// @param _seed the seed for generating random numbers
    /// @param _max the maximum value to generate (non-inclusive)
    /// @param _offset the offset to add to the generated number
    /// @return a pseudo-random number between [offset, max + offset)
    function random(uint256 _seed, uint256 _max, uint256 _offset) internal view returns (uint256) {
        assert(_max > 1);
        return (uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _seed))) % _max) + _offset;
    }

    /// @dev generate a pseudo-random address for testing purposes only
    function randomAddress(uint256 _seed) internal view returns (address) {
        return address(uint160(PseudoRandom.random(_seed, uint256(uint160(address(MAX_EVM_ADDRESS))))));
    }

    /// @dev generate pseudo-random bytes for testing purposes only
    function randomBytes(uint256 _seed, uint256 _n) internal view returns (bytes memory) {
        bytes memory buffer = new bytes(_n);
        for (uint256 i = 0; i < _n; i++) {
            buffer[i] = bytes1(uint8(random(_seed + i, type(uint256).max)));
        }
        return buffer;
    }

    /// @dev 50% chance of generating empty bytes payload, 50% chance of generating a random payload.  For testing purposes only.
    /// @param _seed the seed for generating random numbers
    /// @param _n the number of bytes to generate
    function randomEmptyOrPopulatedBytes(uint256 _seed, uint256 _n) internal view returns (bytes memory) {
        return randomEmptyOrPopulatedBytes(_seed, _n, 50);
    }

    /// @dev emptyPercentage % chance of generating empty bytes payload, (100-emptyPercentage) % chance of generating a random payload.  For testing purposes only.
    /// @param _seed the seed for generating random numbers
    /// @param _n the number of bytes to generate
    /// @param _emptyPercentage the percentage chance of returning empty bytes (0 - 100)
    function randomEmptyOrPopulatedBytes(
        uint256 _seed,
        uint256 _n,
        uint8 _emptyPercentage
    ) internal view returns (bytes memory) {
        if (PseudoRandom.random(_seed + 1, 101, 0) <= _emptyPercentage) {
            return "";
        }
        return PseudoRandom.randomBytes(_seed, _n);
    }
}

// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

struct Result {
    bool success;
    uint256 balance;
}

contract BalanceUtils {
    function getBalance(address user, address token) public view returns (Result memory) {
        uint256 size;
        assembly {
            size := extcodesize(token)
        }
        if (size == 0) {
            return Result(false, 0);
        }

        (bool success, bytes memory data) = token.staticcall(abi.encodeWithSelector(0x70a08231, user));

        if (success) {
            uint256 balance = abi.decode(data, (uint256));
            return Result(true, balance);
        } else {
            return Result(false, 0);
        }
    }

    function getBalances(address user, address[] calldata tokens) external view returns (Result[] memory) {
        Result[] memory results = new Result[](tokens.length + 1);

        for (uint i = 0; i < tokens.length; i++) {
            results[i] = getBalance(user, tokens[i]);
        }

        results[tokens.length] = Result(true, address(user).balance);

        return results;
    }
}

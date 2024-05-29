// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { console } from "forge-std/Test.sol";

contract BaseHandler {
    mapping(string => uint) public numUnboundedCalls;
    uint256 public totalUnboundedCalls;

    mapping(string => uint) public numBoundedCalls;
    uint256 public totalBoundedCalls;

    mapping(string => bool) public functionsNameMap;
    string[] public functionNameList;

    modifier unboundedCall(string memory action) {
        addFunctionName(action);
        numUnboundedCalls[action]++;
        totalUnboundedCalls++;
        _;
    }

    modifier boundedCall(string memory action) {
        addFunctionName(action);
        numBoundedCalls[action]++;
        totalBoundedCalls++;
        _;
    }

    function addFunctionName(string memory action) internal {
        if (functionsNameMap[action] == false) {
            functionsNameMap[action] = true;
            functionNameList.push(action);
        }
    }

    function printCallSummary(string memory name) external view {
        console.log("\n %s Call Summary    fuzzing bounded calls(unbounded calls)\n", name);
        for (uint256 i = 0; i < functionNameList.length; i++) {
            string memory action = functionNameList[i];
            console.log("%s         %s(%s)", action, numBoundedCalls[action], numUnboundedCalls[action]);
        }
        console.log("------------------");
        console.log("Sum  %s(%s) \n", totalBoundedCalls, totalUnboundedCalls);
    }
}

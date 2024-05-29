// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IOFTCore } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { ICommonOFT } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/ICommonOFT.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IOFT as IOFTV1 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { IOFTV2 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import { INativeOFT } from "../interfaces/INativeOFT.sol";

abstract contract MockOFTBase is IERC20, IOFTV1, IOFTV2, INativeOFT {
    event MockEvent(bytes32 paramsHash);
    event MockEventWithoutValue(bytes32 paramsHash);

    address public immutable proxied;

    constructor(address _proxied) {
        proxied = _proxied;
    }

    // ---------- IERC20 Interface ----------
    function totalSupply() external pure returns (uint256) {
        return 256000;
    }

    function transfer(address to, uint256 value) external override returns (bool) {
        emit MockEventWithoutValue(keccak256(abi.encodeWithSelector(this.transfer.selector, to, value)));
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external override returns (bool) {
        emit MockEventWithoutValue(
            keccak256(abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, value))
        );
        return true;
    }

    function allowance(address /*owner*/, address /*spender*/) external pure returns (uint256) {
        return 1000;
    }

    function balanceOf(address /*account*/) external pure returns (uint256) {
        return 100000;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        emit MockEventWithoutValue(keccak256(abi.encodeWithSelector(this.approve.selector, spender, value)));
        return true;
    }

    // ---------- IERC165 Interface ----------
    function supportsInterface(bytes4 /*interfaceId*/) external pure returns (bool) {
        return true;
    }

    // ---------- INativeOFT Interface ----------
    function deposit() external payable {
        emit MockEvent(keccak256(abi.encodeWithSelector(this.deposit.selector, msg.value)));
    }

    // ---------- IOFTV1 && IOFTV2 Interface ----------
    function token() external view override(IOFTCore, ICommonOFT) returns (address) {
        return proxied;
    }

    function circulatingSupply() external pure override(IOFTCore, ICommonOFT) returns (uint256) {
        revert("MockOFT: NotImplemented");
    }

    // ---------- IOFTV1 Interface ----------
    function estimateSendFee(
        uint16 /*_dstChainId*/,
        bytes calldata /*_toAddress*/,
        uint256 _amount,
        bool /*_useZro*/,
        bytes calldata /*_adapterParams*/
    ) external pure returns (uint256 nativeFee, uint256 zroFee) {
        return (_amount, 20);
    }

    // ---------- IOFTV2 Interface ----------
    function estimateSendFee(
        uint16 /*_dstChainId*/,
        bytes32 /*_toAddress*/,
        uint256 _amount,
        bool /*_useZro*/,
        bytes calldata /*_adapterParams*/
    ) external pure returns (uint256 /*nativeFee*/, uint256 /*zroFee*/) {
        return (_amount, 20);
    }

    function estimateSendAndCallFee(
        uint16 /*_dstChainId*/,
        bytes32 /*_toAddress*/,
        uint256 /*_amount*/,
        bytes calldata /*_payload*/,
        uint64 /*_dstGasForCall*/,
        bool /*_useZro*/,
        bytes calldata /*_adapterParams*/
    ) external pure returns (uint256 /*nativeFee*/, uint256 /*zroFee*/) {
        revert("MockOFT: NotImplemented");
    }

    function sendAndCall(
        address /*_from*/,
        uint16 /*_dstChainId*/,
        bytes32 /*_toAddress*/,
        uint256 /*_amount*/,
        bytes calldata /*_payload*/,
        uint64 /*_dstGasForCall*/,
        ICommonOFT.LzCallParams calldata /*_callParams*/
    ) external payable {
        revert("MockOFT: NotImplemented");
    }

    // // ---------- IOFTWithFee Interface ----------
    function sendAndCall(
        address /*_from*/,
        uint16 /*_dstChainId*/,
        bytes32 /*_toAddress*/,
        uint256 /*_amount*/,
        uint256 /*_minAmount*/,
        bytes calldata /*_payload*/,
        uint64 /*_dstGasForCall*/,
        ICommonOFT.LzCallParams calldata /*_callParams*/
    ) external payable {
        revert("MockOFT: NotImplemented");
    }
}

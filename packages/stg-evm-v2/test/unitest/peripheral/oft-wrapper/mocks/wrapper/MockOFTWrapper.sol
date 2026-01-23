pragma solidity ^0.8.22;

import { OFTWrapper } from "../../../../../../src/peripheral/oft-wrapper/OFTWrapper.sol";

contract MockOFTWrapper is OFTWrapper {
    constructor(uint256 _defaultBps, uint256 _callerBpsCap) OFTWrapper(_defaultBps, _callerBpsCap) {}

    function exposed_removeDust(
        uint _amount,
        uint _localDecimals,
        uint _sharedDecimals
    ) external view virtual returns (uint amountAfter, uint dust) {
        return _removeDust(_amount, _localDecimals, _sharedDecimals);
    }
}

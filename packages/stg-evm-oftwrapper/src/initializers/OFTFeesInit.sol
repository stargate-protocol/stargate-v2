// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AppStorage } from "../AppStorage.sol";
import { LibOFTFee } from "../libraries/LibOFTFee.sol";

contract OFTFeesInit {
    AppStorage internal s;

    function init(uint256 _defaultBps) external {
        require(_defaultBps < LibOFTFee.BPS_DENOMINATOR, "OFTWrapper: defaultBps >= 100%");
        s.defaultBps = _defaultBps;
    }
}

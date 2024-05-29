// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IntentBase } from "./IntentBase.sol";

contract IntentOFT is IntentBase {
    constructor(address _stargate, address _permit2) IntentBase(_stargate, _permit2) {}
}

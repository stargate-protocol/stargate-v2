// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Blacklistable } from "../../src/usdc/impl/v1/Blacklistable.sol";

/// @title Blacklistable mock.
/// @dev A mock Blacklistable implementation, used for testing only.
contract BlacklistableMock is Blacklistable {
    constructor() {
        blacklister = msg.sender;
    }

    /**
     * @inheritdoc Blacklistable
     */
    function _blacklist(address _account) internal override {
        _setBlacklistState(_account, true);
    }

    /**
     * @inheritdoc Blacklistable
     */
    function _unBlacklist(address _account) internal override {
        _setBlacklistState(_account, false);
    }

    /**
     * @inheritdoc Blacklistable
     */
    function _isBlacklisted(address _account) internal view virtual override returns (bool) {
        return _deprecatedBlacklisted[_account];
    }

    /**
     * @dev Helper method that sets the blacklist state of an account.
     * @param _account         The address of the account.
     * @param _shouldBlacklist True if the account should be blacklisted, false if the account should be unblacklisted.
     */
    function _setBlacklistState(address _account, bool _shouldBlacklist) internal virtual {
        _deprecatedBlacklisted[_account] = _shouldBlacklist;
    }
}

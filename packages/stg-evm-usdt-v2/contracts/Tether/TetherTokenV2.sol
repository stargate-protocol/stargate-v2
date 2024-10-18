// SPDX-License-Identifier: Apache 2.0
import "./TetherToken.sol";
import "./EIP3009.sol";
import "./util/SignatureChecker.sol";
pragma solidity 0.8.4;

contract TetherTokenV2 is TetherToken, EIP3009 {
    bytes32 internal constant _PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    constructor() initializer {}

    function domainSeparator() internal view virtual override returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * The following applies to the following function and comments to that function:
     *
     * SPDX-License-Identifier: Apache-2.0
     *
     * Copyright (c) 2023, Circle Internet Financial, LLC.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     * ---------------------------------------------------------------------
     *
     * Adapted by Tether.to 2024 for greater flexibility and reusability
     */
    function _permit(
        address owner_,
        address spender,
        uint256 value,
        uint256 deadline,
        bytes memory signature
    ) internal {
        require(block.timestamp <= deadline, "ERC20Permit: expired deadline");

        bytes32 structHash = keccak256(
            abi.encode(_PERMIT_TYPEHASH, owner_, spender, value, _useNonce(owner_), deadline)
        );

        bytes32 hash = _hashTypedDataV4(structHash);

        require(SignatureChecker.isValidSignatureNow(owner_, hash, signature), "EIP2612: invalid signature");

        _approve(owner_, spender, value);
    }

    /**
     * @notice Update allowance with a signed permit
     * @param owner_       Token owner's address
     * @param spender     Spender's address
     * @param value       Amount of allowance
     * @param deadline    The time at which the signature expires (unix time)
     * @param v   signature component v
     * @param r   signature component r
     * @param s   signature component s
     */
    function permit(
        address owner_,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        _permit(owner_, spender, value, deadline, abi.encodePacked(r, s, v));
    }

    /**
     * The following applies to the following function and comments to that function:
     *
     * SPDX-License-Identifier: Apache-2.0
     *
     * Copyright (c) 2023, Circle Internet Financial, LLC.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     * ---------------------------------------------------------------------
     *
     * Adapted by Tether.to 2024 for greater flexibility and reusability
     */

    /**
     * @notice Update allowance with a signed permit
     * @dev EOA wallet signatures should be packed in the order of r, s, v.
     * @param owner_       Token owner's address (Authorizer)
     * @param spender     Spender's address
     * @param value       Amount of allowance
     * @param deadline    The time at which the signature expires (unix time), or max uint256 value to signal no expiration
     * @param signature   Signature bytes signed by an EOA wallet or a contract wallet
     */
    function permit(address owner_, address spender, uint256 value, uint256 deadline, bytes memory signature) external {
        _permit(owner_, spender, value, deadline, signature);
    }

    /**
     * The following applies to the following function and comments to that function:
     *
     * SPDX-License-Identifier: Apache-2.0
     *
     * Copyright (c) 2023, Circle Internet Financial, LLC.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     * ---------------------------------------------------------------------
     *
     * Adapted by Tether.to 2024 for greater flexibility and reusability
     */

    /**
     * @notice Execute a transfer with a signed authorization
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public onlyNotBlocked {
        _transferWithAuthorizationValidityCheck(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            abi.encodePacked(r, s, v)
        );
        _transfer(from, to, value);
    }

    /**
     * The following applies to the following function and comments to that function:
     *
     * SPDX-License-Identifier: Apache-2.0
     *
     * Copyright (c) 2023, Circle Internet Financial, LLC.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     * ---------------------------------------------------------------------
     *
     * Adapted by Tether.to 2024 for greater flexibility and reusability
     */

    /**
     * @notice Execute a transfer with a signed authorization
     * @dev EOA wallet signatures should be packed in the order of r, s, v.
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param signature     Signature bytes signed by an EOA wallet or a contract wallet
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    ) external onlyNotBlocked {
        _transferWithAuthorizationValidityCheck(from, to, value, validAfter, validBefore, nonce, signature);
        _transfer(from, to, value);
    }

    /**
     * The following applies to the following function and comments to that function:
     *
     * SPDX-License-Identifier: Apache-2.0
     *
     * Copyright (c) 2023, Circle Internet Financial, LLC.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     * ---------------------------------------------------------------------
     *
     * Adapted by Tether.to 2024 for greater flexibility and reusability
     */

    /**
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address
     * matches the caller of this function to prevent front-running attacks.
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public onlyNotBlocked {
        _receiveWithAuthorizationValidityCheck(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            abi.encodePacked(r, s, v)
        );
        _transfer(from, to, value);
    }

    /**
     * The following applies to the following function and comments to that function:
     *
     * SPDX-License-Identifier: Apache-2.0
     *
     * Copyright (c) 2023, Circle Internet Financial, LLC.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     * ---------------------------------------------------------------------
     *
     * Adapted by Tether.to 2024 for greater flexibility and reusability
     */

    /**
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address
     * matches the caller of this function to prevent front-running attacks.
     * EOA wallet signatures should be packed in the order of r, s, v.
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param signature     Signature bytes signed by an EOA wallet or a contract wallet
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    ) external onlyNotBlocked {
        _receiveWithAuthorizationValidityCheck(from, to, value, validAfter, validBefore, nonce, signature);
        _transfer(from, to, value);
    }

    uint256[48] private __gap;
}

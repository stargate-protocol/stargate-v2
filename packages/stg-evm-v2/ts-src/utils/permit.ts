import { ArtifactData } from 'hardhat-deploy/dist/types'

export const artifact: ArtifactData = {
    abi: [
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: 'deadline',
                    type: 'uint256',
                },
            ],
            name: 'AllowanceExpired',
            type: 'error',
        },
        {
            inputs: [],
            name: 'ExcessiveInvalidation',
            type: 'error',
        },
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'InsufficientAllowance',
            type: 'error',
        },
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: 'maxAmount',
                    type: 'uint256',
                },
            ],
            name: 'InvalidAmount',
            type: 'error',
        },
        {
            inputs: [],
            name: 'InvalidContractSignature',
            type: 'error',
        },
        {
            inputs: [],
            name: 'InvalidNonce',
            type: 'error',
        },
        {
            inputs: [],
            name: 'InvalidSignature',
            type: 'error',
        },
        {
            inputs: [],
            name: 'InvalidSignatureLength',
            type: 'error',
        },
        {
            inputs: [],
            name: 'InvalidSigner',
            type: 'error',
        },
        {
            inputs: [],
            name: 'LengthMismatch',
            type: 'error',
        },
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: 'signatureDeadline',
                    type: 'uint256',
                },
            ],
            name: 'SignatureExpired',
            type: 'error',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint160',
                    name: 'amount',
                    type: 'uint160',
                },
                {
                    indexed: false,
                    internalType: 'uint48',
                    name: 'expiration',
                    type: 'uint48',
                },
            ],
            name: 'Approval',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
            ],
            name: 'Lockdown',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint48',
                    name: 'newNonce',
                    type: 'uint48',
                },
                {
                    indexed: false,
                    internalType: 'uint48',
                    name: 'oldNonce',
                    type: 'uint48',
                },
            ],
            name: 'NonceInvalidation',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint160',
                    name: 'amount',
                    type: 'uint160',
                },
                {
                    indexed: false,
                    internalType: 'uint48',
                    name: 'expiration',
                    type: 'uint48',
                },
                {
                    indexed: false,
                    internalType: 'uint48',
                    name: 'nonce',
                    type: 'uint48',
                },
            ],
            name: 'Permit',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'word',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'mask',
                    type: 'uint256',
                },
            ],
            name: 'UnorderedNonceInvalidation',
            type: 'event',
        },
        {
            inputs: [],
            name: 'DOMAIN_SEPARATOR',
            outputs: [
                {
                    internalType: 'bytes32',
                    name: '',
                    type: 'bytes32',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
            ],
            name: 'allowance',
            outputs: [
                {
                    internalType: 'uint160',
                    name: 'amount',
                    type: 'uint160',
                },
                {
                    internalType: 'uint48',
                    name: 'expiration',
                    type: 'uint48',
                },
                {
                    internalType: 'uint48',
                    name: 'nonce',
                    type: 'uint48',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
                {
                    internalType: 'uint160',
                    name: 'amount',
                    type: 'uint160',
                },
                {
                    internalType: 'uint48',
                    name: 'expiration',
                    type: 'uint48',
                },
            ],
            name: 'approve',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
                {
                    internalType: 'uint48',
                    name: 'newNonce',
                    type: 'uint48',
                },
            ],
            name: 'invalidateNonces',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: 'wordPos',
                    type: 'uint256',
                },
                {
                    internalType: 'uint256',
                    name: 'mask',
                    type: 'uint256',
                },
            ],
            name: 'invalidateUnorderedNonces',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'spender',
                            type: 'address',
                        },
                    ],
                    internalType: 'struct IAllowanceTransfer.TokenSpenderPair[]',
                    name: 'approvals',
                    type: 'tuple[]',
                },
            ],
            name: 'lockdown',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
                {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                },
            ],
            name: 'nonceBitmap',
            outputs: [
                {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    internalType: 'address',
                                    name: 'token',
                                    type: 'address',
                                },
                                {
                                    internalType: 'uint160',
                                    name: 'amount',
                                    type: 'uint160',
                                },
                                {
                                    internalType: 'uint48',
                                    name: 'expiration',
                                    type: 'uint48',
                                },
                                {
                                    internalType: 'uint48',
                                    name: 'nonce',
                                    type: 'uint48',
                                },
                            ],
                            internalType: 'struct IAllowanceTransfer.PermitDetails[]',
                            name: 'details',
                            type: 'tuple[]',
                        },
                        {
                            internalType: 'address',
                            name: 'spender',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'sigDeadline',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct IAllowanceTransfer.PermitBatch',
                    name: 'permitBatch',
                    type: 'tuple',
                },
                {
                    internalType: 'bytes',
                    name: 'signature',
                    type: 'bytes',
                },
            ],
            name: 'permit',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    internalType: 'address',
                                    name: 'token',
                                    type: 'address',
                                },
                                {
                                    internalType: 'uint160',
                                    name: 'amount',
                                    type: 'uint160',
                                },
                                {
                                    internalType: 'uint48',
                                    name: 'expiration',
                                    type: 'uint48',
                                },
                                {
                                    internalType: 'uint48',
                                    name: 'nonce',
                                    type: 'uint48',
                                },
                            ],
                            internalType: 'struct IAllowanceTransfer.PermitDetails',
                            name: 'details',
                            type: 'tuple',
                        },
                        {
                            internalType: 'address',
                            name: 'spender',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'sigDeadline',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct IAllowanceTransfer.PermitSingle',
                    name: 'permitSingle',
                    type: 'tuple',
                },
                {
                    internalType: 'bytes',
                    name: 'signature',
                    type: 'bytes',
                },
            ],
            name: 'permit',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            components: [
                                {
                                    internalType: 'address',
                                    name: 'token',
                                    type: 'address',
                                },
                                {
                                    internalType: 'uint256',
                                    name: 'amount',
                                    type: 'uint256',
                                },
                            ],
                            internalType: 'struct ISignatureTransfer.TokenPermissions',
                            name: 'permitted',
                            type: 'tuple',
                        },
                        {
                            internalType: 'uint256',
                            name: 'nonce',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'deadline',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct ISignatureTransfer.PermitTransferFrom',
                    name: 'permit',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'to',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'requestedAmount',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct ISignatureTransfer.SignatureTransferDetails',
                    name: 'transferDetails',
                    type: 'tuple',
                },
                {
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    internalType: 'bytes',
                    name: 'signature',
                    type: 'bytes',
                },
            ],
            name: 'permitTransferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            components: [
                                {
                                    internalType: 'address',
                                    name: 'token',
                                    type: 'address',
                                },
                                {
                                    internalType: 'uint256',
                                    name: 'amount',
                                    type: 'uint256',
                                },
                            ],
                            internalType: 'struct ISignatureTransfer.TokenPermissions[]',
                            name: 'permitted',
                            type: 'tuple[]',
                        },
                        {
                            internalType: 'uint256',
                            name: 'nonce',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'deadline',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct ISignatureTransfer.PermitBatchTransferFrom',
                    name: 'permit',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'to',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'requestedAmount',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct ISignatureTransfer.SignatureTransferDetails[]',
                    name: 'transferDetails',
                    type: 'tuple[]',
                },
                {
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    internalType: 'bytes',
                    name: 'signature',
                    type: 'bytes',
                },
            ],
            name: 'permitTransferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            components: [
                                {
                                    internalType: 'address',
                                    name: 'token',
                                    type: 'address',
                                },
                                {
                                    internalType: 'uint256',
                                    name: 'amount',
                                    type: 'uint256',
                                },
                            ],
                            internalType: 'struct ISignatureTransfer.TokenPermissions',
                            name: 'permitted',
                            type: 'tuple',
                        },
                        {
                            internalType: 'uint256',
                            name: 'nonce',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'deadline',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct ISignatureTransfer.PermitTransferFrom',
                    name: 'permit',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'to',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'requestedAmount',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct ISignatureTransfer.SignatureTransferDetails',
                    name: 'transferDetails',
                    type: 'tuple',
                },
                {
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    internalType: 'bytes32',
                    name: 'witness',
                    type: 'bytes32',
                },
                {
                    internalType: 'string',
                    name: 'witnessTypeString',
                    type: 'string',
                },
                {
                    internalType: 'bytes',
                    name: 'signature',
                    type: 'bytes',
                },
            ],
            name: 'permitWitnessTransferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            components: [
                                {
                                    internalType: 'address',
                                    name: 'token',
                                    type: 'address',
                                },
                                {
                                    internalType: 'uint256',
                                    name: 'amount',
                                    type: 'uint256',
                                },
                            ],
                            internalType: 'struct ISignatureTransfer.TokenPermissions[]',
                            name: 'permitted',
                            type: 'tuple[]',
                        },
                        {
                            internalType: 'uint256',
                            name: 'nonce',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'deadline',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct ISignatureTransfer.PermitBatchTransferFrom',
                    name: 'permit',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'to',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'requestedAmount',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct ISignatureTransfer.SignatureTransferDetails[]',
                    name: 'transferDetails',
                    type: 'tuple[]',
                },
                {
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    internalType: 'bytes32',
                    name: 'witness',
                    type: 'bytes32',
                },
                {
                    internalType: 'string',
                    name: 'witnessTypeString',
                    type: 'string',
                },
                {
                    internalType: 'bytes',
                    name: 'signature',
                    type: 'bytes',
                },
            ],
            name: 'permitWitnessTransferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'from',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'to',
                            type: 'address',
                        },
                        {
                            internalType: 'uint160',
                            name: 'amount',
                            type: 'uint160',
                        },
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                    ],
                    internalType: 'struct IAllowanceTransfer.AllowanceTransferDetails[]',
                    name: 'transferDetails',
                    type: 'tuple[]',
                },
            ],
            name: 'transferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'from',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: 'to',
                    type: 'address',
                },
                {
                    internalType: 'uint160',
                    name: 'amount',
                    type: 'uint160',
                },
                {
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
            ],
            name: 'transferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
    ],
    bytecode:
        '0x60c0346100bb574660a052602081017f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a86681527f9ac997416e8ff9d2ff6bebeb7149f65cdae5e32e2b90440b566bb3044041d36a60408301524660608301523060808301526080825260a082019180831060018060401b038411176100a5578260405251902060805261222290816100c18239608051816118b0015260a0518161188a0152f35b634e487b7160e01b600052604160045260246000fd5b600080fdfe6040608081526004908136101561001557600080fd5b600090813560e01c80630d58b1db146110c8578063137c29fe14610eef5780632a2d80d114610c4f5780632b67b57014610a9457806330f28b7a146109b25780633644e5151461098f57806336c78516146109385780633ff9dcb1146108d65780634fe02b441461088b57806365d9723c1461071657806387517c4514610602578063927da10514610569578063cc53287f14610467578063edd9444b1461031c5763fe8ec1a7146100c657600080fd5b346103185760c06003193601126103185767ffffffffffffffff8335818111610314576100f6903690860161146b565b6024358281116103105761010d903690870161143a565b610115611324565b9160843585811161030c5761012d9036908a016113e1565b98909560a43590811161030857610146913691016113e1565b9690958151906101558261123d565b606b82527f5065726d697442617463685769746e6573735472616e7366657246726f6d285460208301527f6f6b656e5065726d697373696f6e735b5d207065726d69747465642c61646472838301527f657373207370656e6465722c75696e74323536206e6f6e63652c75696e74323560608301527f3620646561646c696e652c000000000000000000000000000000000000000000608083015282519a8b9181610204602085018096611cfc565b918237018a8152039961023d7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09b8c8101835282611275565b5190209085515161024d81611c24565b908a5b8181106102db5750506102d8999a6102cf91835161028281610276602082018095611ccf565b03848101835282611275565b519020602089810151858b015195519182019687526040820192909252336060820152608081019190915260a081019390935260643560c08401528260e081015b03908101835282611275565b51902093611a60565b80f35b806102f36102ed610303938c5161157e565b51611dbd565b6102fd828661157e565b52611c73565b610250565b8880fd5b8780fd5b8480fd5b8380fd5b5080fd5b5091346103185760806003193601126103185767ffffffffffffffff9080358281116103145761034f903690830161146b565b60243583811161031057610366903690840161143a565b939092610371611324565b9160643590811161046357610388913691016113e1565b9490938351519761039889611c24565b98885b8181106104415750506102d8979881516103e9816103bd602082018095611ccf565b037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08101835282611275565b5190206020860151828701519083519260208401947ffcf35f5ac6a2c28868dc44c302166470266239195f02b0ee408334829333b7668652840152336060840152608083015260a082015260a081526102cf81611259565b808b6102fd826104586102ed61045e968d5161157e565b9261157e565b61039b565b8680fd5b50823461056557602090816003193601126103145780359067ffffffffffffffff82116103105761049a9136910161143a565b929091845b8481106104aa578580f35b806104c06104bb60019388886116d5565b6116e5565b6104d5846104cf848a8a6116d5565b016116e5565b3389528385528589209173ffffffffffffffffffffffffffffffffffffffff80911692838b528652868a20911690818a5285528589207fffffffffffffffffffffffff000000000000000000000000000000000000000081541690558551918252848201527f89b1add15eff56b3dfe299ad94e01f2b52fbcb80ae1a3baea6ae8c04cb2b98a4853392a20161049f565b8280fd5b5034610318576060600319360112610318576105fe816105876112de565b93610590611301565b610598611324565b73ffffffffffffffffffffffffffffffffffffffff968716835260016020908152848420928816845291825283832090871683528152919020549251938316845260a083901c65ffffffffffff169084015260d09190911c604083015281906060820190565b0390f35b50346103185760806003193601126103185761061c6112de565b90610625611301565b9161062e611324565b65ffffffffffff926064358481169081810361030c5779ffffffffffff0000000000000000000000000000000000000000947fda9fa7c1b00402c17d0161b249b1ab8bbec047c5a52207b9c112deffd817036b94338a5260016020527fffffffffffff0000000000000000000000000000000000000000000000000000858b209873ffffffffffffffffffffffffffffffffffffffff809416998a8d5260205283878d209b169a8b8d52602052868c2094861560001461070e57504216925b8454921697889360a01b16911617179055815193845260208401523392a480f35b9050926106ed565b508234610565576060600319360112610565576107316112de565b9061073a611301565b9265ffffffffffff604435818116939084810361030c57338852602091600183528489209673ffffffffffffffffffffffffffffffffffffffff80911697888b528452858a20981697888a5283528489205460d01c93848711156108635761ffff90858403161161083c5750907f55eb90d810e1700b35a8e7e25395ff7f2b2259abd7415ca2284dfb1c246418f393929133895260018252838920878a528252838920888a5282528389209079ffffffffffffffffffffffffffffffffffffffffffffffffffff7fffffffffffff000000000000000000000000000000000000000000000000000083549260d01b16911617905582519485528401523392a480f35b84517f24d35a26000000000000000000000000000000000000000000000000000000008152fd5b5084517f756688fe000000000000000000000000000000000000000000000000000000008152fd5b50346103185780600319360112610318578060209273ffffffffffffffffffffffffffffffffffffffff6108bd6112de565b1681528084528181206024358252845220549051908152f35b5082346105655781600319360112610565577f3704902f963766a4e561bbaab6e6cdc1b1dd12f6e9e99648da8843b3f46b918d90359160243533855284602052818520848652602052818520818154179055815193845260208401523392a280f35b823461098c57608060031936011261098c576109526112de565b61095a611301565b610962611324565b6064359173ffffffffffffffffffffffffffffffffffffffff83168303610310576102d8936115c1565b80fd5b50346103185781600319360112610318576020906109ab611887565b9051908152f35b5082903461056557610100600319360112610565576109d036611368565b90807fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7c36011261031457610a026112b6565b9160e43567ffffffffffffffff8111610a90576102d894610a25913691016113e1565b939092610a328351611dbd565b6020840151828501519083519260208401947f939c21a48a8dbe3a9a2404a1d46691e4d39f6583d6ec6b35714604c986d801068652840152336060840152608083015260a082015260a08152610a8781611259565b5190209161198e565b8580fd5b5091346103185761010060031936011261031857610ab06112de565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffdc360160c08112610314576080855191610ae983611221565b1261031457845190610afa826111d6565b73ffffffffffffffffffffffffffffffffffffffff916024358381168103610463578152604435838116810361046357602082015265ffffffffffff606435818116810361030c57888301526084359081168103610463576060820152815260a435938285168503610a90576020820194855260c4359087830182815260e43567ffffffffffffffff811161030857610b9690369084016113e1565b929093804211610c20575050918591610c106102d8999a610c1695610bbb8851611d27565b90898c511690519083519260208401947ff3841cd1ff0085026a6327b620b67997ce40f282c88a8e905a7a5626e310f3d086528401526060830152608082015260808152610c088161123d565b519020611942565b91611e30565b5192511691611706565b602492508a51917fcd21db4f000000000000000000000000000000000000000000000000000000008352820152fd5b50913461031857606060031993818536011261031457610c6d6112de565b9260249081359267ffffffffffffffff9788851161030c57859085360301126104635780519785890189811082821117610ec4578252848301358181116103085785019036602383011215610308578382013591610cca8361140f565b90610cd785519283611275565b838252602093878584019160071b83010191368311610ec0578801905b828210610e63575050508a526044610d0d868801611347565b96838c01978852013594838b0191868352604435908111610e5f57610d3590369087016113e1565b959096804211610e34575050508998995151610d5081611c24565b908b5b818110610e1157505092889492610c1092610dde97958351610d7c816103bd8682018095611ccf565b5190209073ffffffffffffffffffffffffffffffffffffffff9a8b8b51169151928551948501957faf1b0d30d2cab0380e68f0689007e3254993c596f2fdd0aaa7f4d04f794408638752850152830152608082015260808152610c088161123d565b51169082515192845b848110610df2578580f35b80610e0b8585610e05600195875161157e565b51611706565b01610de7565b806102f3610e268e9f9e93610e2c945161157e565b51611d27565b9b9a9b610d53565b8551917fcd21db4f000000000000000000000000000000000000000000000000000000008352820152fd5b8a80fd5b608082360312610ec057856080918851610e7c816111d6565b610e8585611347565b8152610e92838601611347565b83820152610ea18a8601611427565b8a8201528d610eb1818701611427565b90820152815201910190610cf4565b8c80fd5b84896041867f4e487b7100000000000000000000000000000000000000000000000000000000835252fd5b5082346105655761014060031936011261056557610f0c36611368565b91807fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7c36011261031457610f3e6112b6565b67ffffffffffffffff93906101043585811161046357610f6190369086016113e1565b90936101243596871161030c57610f81610a87966102d8983691016113e1565b969095825190610f908261123d565b606482527f5065726d69745769746e6573735472616e7366657246726f6d28546f6b656e5060208301527f65726d697373696f6e73207065726d69747465642c6164647265737320737065848301527f6e6465722c75696e74323536206e6f6e63652c75696e7432353620646561646c60608301527f696e652c00000000000000000000000000000000000000000000000000000000608083015283519485918161103f602085018096611cfc565b918237018b815203936110787fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe095868101835282611275565b519020926110868651611dbd565b6020878101518589015195519182019687526040820192909252336060820152608081019190915260a081019390935260e43560c08401528260e081016102c3565b5082346105655760208060031936011261031457813567ffffffffffffffff92838211610a905736602383011215610a9057810135928311610310576024906007368386831b8401011161046357865b858110611123578780f35b80821b83019060807fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffdc8336030112610308576111d088876001946060835161116a816111d6565b6111a6608461117a8d8601611347565b9485845261118a60448201611347565b809785015261119b60648201611347565b809885015201611347565b918291015273ffffffffffffffffffffffffffffffffffffffff80808093169516931691166115c1565b01611118565b6080810190811067ffffffffffffffff8211176111f257604052565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6060810190811067ffffffffffffffff8211176111f257604052565b60a0810190811067ffffffffffffffff8211176111f257604052565b60c0810190811067ffffffffffffffff8211176111f257604052565b90601f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0910116810190811067ffffffffffffffff8211176111f257604052565b60c4359073ffffffffffffffffffffffffffffffffffffffff821682036112d957565b600080fd5b6004359073ffffffffffffffffffffffffffffffffffffffff821682036112d957565b6024359073ffffffffffffffffffffffffffffffffffffffff821682036112d957565b6044359073ffffffffffffffffffffffffffffffffffffffff821682036112d957565b359073ffffffffffffffffffffffffffffffffffffffff821682036112d957565b6003190190608082126112d957604080519061138382611221565b808294126112d957805181810181811067ffffffffffffffff8211176111f257825260043573ffffffffffffffffffffffffffffffffffffffff811681036112d9578152602435602082015282526044356020830152606435910152565b9181601f840112156112d95782359167ffffffffffffffff83116112d957602083818601950101116112d957565b67ffffffffffffffff81116111f25760051b60200190565b359065ffffffffffff821682036112d957565b9181601f840112156112d95782359167ffffffffffffffff83116112d9576020808501948460061b0101116112d957565b9190916060818403126112d957604080519161148683611221565b8294813567ffffffffffffffff908181116112d957830182601f820112156112d95780356114b38161140f565b926114c087519485611275565b818452602094858086019360061b850101938185116112d9579086899897969594939201925b848410611503575050505050855280820135908501520135910152565b9091929394959697848303126112d9578851908982019082821085831117611550578a928992845261153487611347565b81528287013583820152815201930191908897969594936114e6565b602460007f4e487b710000000000000000000000000000000000000000000000000000000081526041600452fd5b80518210156115925760209160051b010190565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b92919273ffffffffffffffffffffffffffffffffffffffff604060008284168152600160205282828220961695868252602052818120338252602052209485549565ffffffffffff8760a01c168042116116a4575082871696838803611632575b50506116309550169261211c565b565b878484161160001461166f57602488604051907ff96fb0710000000000000000000000000000000000000000000000000000000082526004820152fd5b7fffffffffffffffffffffffff000000000000000000000000000000000000000084846116309a031691161790553880611622565b602490604051907fd81b2f2e0000000000000000000000000000000000000000000000000000000082526004820152fd5b91908110156115925760061b0190565b3573ffffffffffffffffffffffffffffffffffffffff811681036112d95790565b9065ffffffffffff908160608401511673ffffffffffffffffffffffffffffffffffffffff908185511694826020820151169280866040809401511695169560009187835260016020528383208984526020528383209916988983526020528282209184835460d01c0361185e57918561183794927fc6a377bfc4eb120024a8ac08eef205be16b817020812c73223e81d1bdb9708ec9897969450871560001461183c5779ffffffffffff00000000000000000000000000000000000000009042165b60a01b167fffffffffffff00000000000000000000000000000000000000000000000000006001860160d01b1617179055519384938491604091949373ffffffffffffffffffffffffffffffffffffffff606085019616845265ffffffffffff809216602085015216910152565b0390a4565b5079ffffffffffff0000000000000000000000000000000000000000876117c9565b600484517f756688fe000000000000000000000000000000000000000000000000000000008152fd5b467f0000000000000000000000000000000000000000000000000000000000000000036118d2577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a86682527f9ac997416e8ff9d2ff6bebeb7149f65cdae5e32e2b90440b566bb3044041d36a60408201524660608201523060808201526080815261193c8161123d565b51902090565b61194a611887565b906040519060208201927f19010000000000000000000000000000000000000000000000000000000000008452602283015260428201526042815261193c816111d6565b9192909360a435936040840151804211611a2f57506020845101518086116119fe5750918591610c106119ce946119c9602088015186611bb0565b611942565b73ffffffffffffffffffffffffffffffffffffffff80915151169260843591821682036112d9576116309361211c565b602490604051907f3728b83d0000000000000000000000000000000000000000000000000000000082526004820152fd5b602490604051907fcd21db4f0000000000000000000000000000000000000000000000000000000082526004820152fd5b959093958051519560409283830151804211611b805750848803611b5757611a97918691610c1060209b6119c98d88015186611bb0565b60005b868110611aab575050505050505050565b611ab681835161157e565b5188611ac383878a6116d5565b01359089810151808311611b27575091818888886001968596611aed575b50505050505001611a9a565b611b1c95611b169273ffffffffffffffffffffffffffffffffffffffff6104bb935116956116d5565b9161211c565b803888888883611ae1565b6024908651907f3728b83d0000000000000000000000000000000000000000000000000000000082526004820152fd5b600484517fff633a38000000000000000000000000000000000000000000000000000000008152fd5b6024908551907fcd21db4f0000000000000000000000000000000000000000000000000000000082526004820152fd5b9073ffffffffffffffffffffffffffffffffffffffff600160ff83161b9216600052600060205260406000209060081c6000526020526040600020818154188091551615611bfa57565b60046040517f756688fe000000000000000000000000000000000000000000000000000000008152fd5b90611c2e8261140f565b611c3b6040519182611275565b8281527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0611c69829461140f565b0190602036910137565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8114611ca05760010190565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b805160208092019160005b828110611ce8575050505090565b835185529381019392810192600101611cda565b9081519160005b838110611d14575050016000815290565b8060208092840101518185015201611d03565b60405160208101917f65626cad6cb96493bf6f5ebea28756c966f023ab9e8a83a7101849d5573b3678835273ffffffffffffffffffffffffffffffffffffffff8082511660408401526020820151166060830152606065ffffffffffff9182604082015116608085015201511660a082015260a0815260c0810181811067ffffffffffffffff8211176111f25760405251902090565b6040516020808201927f618358ac3db8dc274f0cd8829da7e234bd48cd73c4a740aede1adec9846d06a1845273ffffffffffffffffffffffffffffffffffffffff8151166040840152015160608201526060815261193c816111d6565b91908260409103126112d9576020823592013590565b6000843b611f97575060418203611f1557611e4d82820182611e1a565b939092604010156115925760209360009360ff6040608095013560f81c5b60405194855216868401526040830152606082015282805260015afa15611f095773ffffffffffffffffffffffffffffffffffffffff8060005116918215611edf571603611eb557565b60046040517f815e1d64000000000000000000000000000000000000000000000000000000008152fd5b60046040517f8baa579f000000000000000000000000000000000000000000000000000000008152fd5b6040513d6000823e3d90fd5b60408203611f6d57611f2991810190611e1a565b91601b7f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff84169360ff1c019060ff8211611ca05760209360009360ff608094611e6b565b60046040517f4be6321b000000000000000000000000000000000000000000000000000000008152fd5b929391601f928173ffffffffffffffffffffffffffffffffffffffff60646020957fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0604051988997889687947f1626ba7e000000000000000000000000000000000000000000000000000000009e8f8752600487015260406024870152816044870152868601378b85828601015201168101030192165afa908115612111578291612093575b507fffffffff000000000000000000000000000000000000000000000000000000009150160361206957565b60046040517fb0669cbc000000000000000000000000000000000000000000000000000000008152fd5b90506020813d8211612109575b816120ad60209383611275565b810103126103185751907fffffffff000000000000000000000000000000000000000000000000000000008216820361098c57507fffffffff00000000000000000000000000000000000000000000000000000000903861203d565b3d91506120a0565b6040513d84823e3d90fd5b9160008093602095606494604051947f23b872dd00000000000000000000000000000000000000000000000000000000865273ffffffffffffffffffffffffffffffffffffffff809216600487015216602485015260448401525af13d15601f3d116001600051141617161561218e57565b60646040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601460248201527f5452414e534645525f46524f4d5f4641494c45440000000000000000000000006044820152fdfea26469706673582212204bd953dbe6c2214fe553b78eb97374e667570a1d4b58c2f09b8748d4a81dcee064736f6c63430008110033',
}

import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import sinon from 'sinon'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { appendDependencies, appendTags, deploy, fillAddress, saveDeployment } from '../../ts-src/utils/helpers'

describe('deploy/helpers', () => {
    let saveSpy: sinon.SinonSpy
    let contractFactorySpy: sinon.SinonSpy
    let getOrNullStub: sinon.SinonStub

    const mockAbi = [
        {
            inputs: [
                { internalType: 'address', name: 'signer', type: 'address' },
                { internalType: 'bytes32', name: 'digest', type: 'bytes32' },
                { internalType: 'bytes', name: 'signature', type: 'bytes' },
            ],
            name: 'isValidSignatureNow',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
        },
    ]

    const mockBytecode =
        '0x6106cd610026600b82828239805160001a60731461001957fe5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600436106100355760003560e01c80636ccea6521461003a575b600080fd5b6101026004803603606081101561005057600080fd5b73ffffffffffffffffffffffffffffffffffffffff8235169160208101359181019060608101604082013564010000000081111561008d57600080fd5b82018360208201111561009f57600080fd5b803590602001918460018302840111640100000000831117156100c157600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610116945050505050565b604080519115158252519081900360200190f35b600061012184610179565b610164578373ffffffffffffffffffffffffffffffffffffffff16610146848461017f565b73ffffffffffffffffffffffffffffffffffffffff16149050610172565b61016f848484610203565b90505b9392505050565b3b151590565b600081516041146101db576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260238152602001806106296023913960400191505060405180910390fd5b60208201516040830151606084015160001a6101f98682858561042d565b9695505050505050565b60008060608573ffffffffffffffffffffffffffffffffffffffff16631626ba7e60e01b86866040516024018083815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561026f578181015183820152602001610257565b50505050905090810190601f16801561029c5780820380516001836020036101000a031916815260200191505b50604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529181526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009098169790971787525181519196909550859450925090508083835b6020831061036957805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0909201916020918201910161032c565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855afa9150503d80600081146103c9576040519150601f19603f3d011682016040523d82523d6000602084013e6103ce565b606091505b50915091508180156103e257506020815110155b80156101f9575080517f1626ba7e00000000000000000000000000000000000000000000000000000000906020808401919081101561042057600080fd5b5051149695505050505050565b60007f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08211156104a8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260268152602001806106726026913960400191505060405180910390fd5b8360ff16601b141580156104c057508360ff16601c14155b15610516576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602681526020018061064c6026913960400191505060405180910390fd5b600060018686868660405160008152602001604052604051808581526020018460ff1681526020018381526020018281526020019450505050506020604051602081039080840390855afa158015610572573d6000803e3d6000fd5b50506040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0015191505073ffffffffffffffffffffffffffffffffffffffff811661061f57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601c60248201527f45435265636f7665723a20696e76616c6964207369676e617475726500000000604482015290519081900360640190fd5b9594505050505056fe45435265636f7665723a20696e76616c6964207369676e6174757265206c656e67746845435265636f7665723a20696e76616c6964207369676e6174757265202776272076616c756545435265636f7665723a20696e76616c6964207369676e6174757265202773272076616c7565a2646970667358221220396564cc3f6f1ac79e5a1955d44766e69c7223ea597e0023ca2ff7cfcb2bd40464736f6c634300060c0033'

    const mockMetadata = JSON.stringify({
        language: 'Solidity',
        compiler: {
            version: '0.6.12+commit.27d51765',
        },
        settings: {
            evmVersion: 'istanbul',
        },
    })

    let hre: HardhatRuntimeEnvironment
    let owner: SignerWithAddress
    let mockContract: Contract
    let endpointV2Mock: ContractFactory
    let endpointOwner: SignerWithAddress
    let mockEndpoint: Contract
    let loggerMock: any

    before(async () => {
        ;[owner, endpointOwner] = await ethers.getSigners()

        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        endpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)

        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpoint = await endpointV2Mock.deploy(EndpointId.ETHEREUM_V2_SANDBOX)

        // Deploying an instance of the Stargate contract and linking it to the mock LZEndpoint
        mockContract = await (
            await ethers.getContractFactory('StargatePool')
        ).deploy('USDC LP Token', 'USDCLP', mockEndpoint.address, 18, 6, mockEndpoint.address, owner.address)

        hre = {
            deployments: {
                save: async (name: string, deployment: any) => {
                    return Promise.resolve(deployment)
                },
                getOrNull: async (name: string) => null,
            },
            ethers,
        } as unknown as HardhatRuntimeEnvironment

        loggerMock = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        }
    })

    afterEach(() => {
        sinon.restore() // Restore sinon after each test to avoid re-wrapping
    })

    describe('appendTags', () => {
        it('should set tags if not defined', () => {
            const tags = ['tag', 'yet-another-tag']
            const deploy: DeployFunction = async () => undefined
            const appended = appendTags(tags)(deploy)

            expect(appended.tags).to.eql(tags)
        })

        it('should append tags if defined', () => {
            const existingTags = ['i-was-here-first', 'me-too']
            const deploy: DeployFunction = async () => undefined
            deploy.tags = existingTags

            const tags = ['tag', 'yet-another-tag']
            const appended = appendTags(tags)(deploy)

            expect(appended.tags).to.eql([...existingTags, ...tags])
        })
    })

    describe('appendDependencies', () => {
        it('should set dependencies if not defined', () => {
            const dependencies = ['dependency', 'yet-another-dependency']
            const deploy: DeployFunction = async () => undefined
            const appended = appendDependencies(dependencies)(deploy)

            expect(appended.dependencies).to.eql(dependencies)
        })

        it('should append dependencies if defined', () => {
            const existingDependencies = ['i-was-here-first', 'me-too']
            const deploy: DeployFunction = async () => undefined
            deploy.dependencies = existingDependencies

            const dependencies = ['dependency', 'yet-another-dependency']
            const appended = appendDependencies(dependencies)(deploy)

            expect(appended.dependencies).to.eql([...existingDependencies, ...dependencies])
        })
    })

    describe('fillAddress', () => {
        it('should replace $ with a valid address', () => {
            const bytecode = '600a600c600$600e600f'
            const address = '0x1234567890abcdef1234567890abcdef12345678'
            const filledBytecode = fillAddress(bytecode, address)

            expect(filledBytecode).to.eql('600a600c6001234567890abcdef1234567890abcdef12345678600e600f')
        })

        it('should replace $ with a valid address without 0x prefix', () => {
            const bytecode = '600a600c600$600e600f'
            const address = '1234567890abcdef1234567890abcdef12345678' // No 0x prefix
            const filledBytecode = fillAddress(bytecode, address)

            expect(filledBytecode).to.eql('600a600c6001234567890abcdef1234567890abcdef12345678600e600f')
        })

        it('should throw an error if address is too short', () => {
            const bytecode = '600a600c600$600e600f'
            const shortAddress = '0x1234567890abcdef1234567890abcdef1234' // Only 36 characters

            expect(() => fillAddress(bytecode, shortAddress)).to.throw(
                `Invalid library address length ${shortAddress.slice(2)}`
            )
        })

        it('should throw an error if address is too long', () => {
            const bytecode = '600a600c600$600e600f'
            const longAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef' // Too many characters

            expect(() => fillAddress(bytecode, longAddress)).to.throw(
                `Invalid library address length ${longAddress.slice(2)}`
            )
        })

        it('should do nothing if no $ is present in the bytecode', () => {
            const bytecode = '600a600c600b600e600f'
            const address = '0x1234567890abcdef1234567890abcdef12345678'
            const filledBytecode = fillAddress(bytecode, address)

            expect(filledBytecode).to.eql(bytecode) // Bytecode remains unchanged
        })

        it('should replace multiple instances of $ with the address', () => {
            const bytecode = '600a600$600c600$600e'
            const address = '0x1234567890abcdef1234567890abcdef12345678'
            const filledBytecode = fillAddress(bytecode, address)

            expect(filledBytecode).to.eql(
                '600a6001234567890abcdef1234567890abcdef12345678600c6001234567890abcdef1234567890abcdef12345678600e'
            )
        })
    })

    describe('saveDeployment', () => {
        it('should save deployment with correct metadata, fields, libraries, and args', async () => {
            const deploymentName = 'MockContractDeployment'
            const deployedBytecode = await ethers.provider.getCode(mockContract.address)

            const mockDeployTx = mockContract.deployTransaction

            const mockLibraries = {
                MockLibrary: '0x1234567890abcdef1234567890abcdef12345678',
            }
            const mockArgs = ['0x1234567890abcdef1234567890abcdef12345678', 100]

            // Mocking the save function of the hre deployments to spy on it
            saveSpy = sinon.spy(hre.deployments, 'save')

            await saveDeployment({
                hre,
                deploymentName,
                deploymentContract: mockContract,
                abi: mockAbi,
                creationBytecode: mockBytecode,
                deployedBytecode,
                libraries: mockLibraries,
                args: mockArgs,
                metadata: mockMetadata,
            })

            expect(saveSpy.calledOnce).to.be.true

            const savedDeployment = saveSpy.getCall(0).args[1]

            expect(savedDeployment).to.have.property('address', mockContract.address)
            expect(savedDeployment).to.have.property('abi').that.eql(mockAbi)
            expect(savedDeployment).to.have.property('transactionHash', mockDeployTx.hash)
            expect(savedDeployment).to.have.property('bytecode', mockBytecode)
            expect(savedDeployment).to.have.property('deployedBytecode', deployedBytecode)
            expect(savedDeployment).to.have.property('receipt').that.is.an('object')
            expect(savedDeployment).to.have.property('libraries').that.eql(mockLibraries)
            expect(savedDeployment).to.have.property('args').that.eql(mockArgs)
            expect(savedDeployment).to.have.property('metadata', mockMetadata).that.eql(mockMetadata)

            expect(savedDeployment.metadata).to.be.a('string')
        })

        it('should handle metadata correctly', async () => {
            const deploymentName = 'MockContractDeploymentWithMetadata'
            const deployedBytecode = await ethers.provider.getCode(mockContract.address)

            const mockLibraries = {
                MockLibrary: '0x1234567890abcdef1234567890abcdef12345678',
            }
            const mockArgs = ['0x1234567890abcdef1234567890abcdef12345678', 100]

            saveSpy = sinon.spy(hre.deployments, 'save')

            await saveDeployment({
                hre,
                deploymentName,
                deploymentContract: mockContract,
                abi: mockAbi,
                creationBytecode: mockBytecode,
                deployedBytecode,
                libraries: mockLibraries,
                args: mockArgs,
                metadata: mockMetadata,
            })

            const savedDeployment = saveSpy.getCall(0).args[1]

            const metadata = savedDeployment.metadata

            expect(metadata).to.be.a('string')
            expect(metadata).to.eql(mockMetadata)
        })
    })

    describe('deploy', () => {
        const differentBytecode = '0x700a700c700e700f'

        beforeEach(async () => {
            sinon.restore()
            // Spy on the deployment process
            saveSpy = sinon.spy(hre.deployments, 'save')
            contractFactorySpy = sinon.spy(ContractFactory.prototype, 'deploy')
            getOrNullStub = sinon.stub(hre.deployments, 'getOrNull')
        })

        afterEach(() => {
            sinon.restore() // Restore sinon after each test to avoid re-wrapping
        })

        it('should deploy a new contract when no existing deployment', async () => {
            const deploymentName = 'MockContractDeployment'
            const overrides = {
                gasPrice: await ethers.provider.getGasPrice(),
            }

            // Call the deploy helper function with no existing deployment
            const result = await deploy({
                hre,
                contractName: 'MockContract',
                deploymentName,
                overrides,
                abi: mockAbi,
                creationBytecode: mockBytecode,
                signer: owner,
                logger: loggerMock,
                libraries: {},
                args: [],
                metadata: mockMetadata,
            })

            // Check if the contract was deployed with correct ABI and bytecode
            expect(contractFactorySpy.calledOnce).to.be.true
            expect(saveSpy.calledOnce).to.be.true

            const savedDeployment = saveSpy.getCall(0).args[1]
            expect(savedDeployment).to.have.property('abi').that.eql(mockAbi)
            expect(savedDeployment).to.have.property('bytecode', mockBytecode)

            // Check if newlyDeployed is true
            expect(result.newlyDeployed).to.be.true
        })

        it('should redeploy when existing deployment bytecode is different', async () => {
            const deploymentName = 'MockContractDeployment'
            const overrides = {
                gasPrice: await ethers.provider.getGasPrice(),
            }

            // Mock `getOrNull` to simulate an existing deployment with different bytecode
            getOrNullStub.resolves({
                address: mockContract.address,
                bytecode: differentBytecode, // Existing deployment has different bytecode
            } as any)

            // Call the deploy helper function
            const result = await deploy({
                hre,
                contractName: 'MockContract',
                deploymentName,
                overrides,
                abi: mockAbi,
                creationBytecode: mockBytecode,
                signer: owner,
                logger: loggerMock,
                libraries: {},
                args: [],
                metadata: mockMetadata,
            })

            // Check if the contract was redeployed
            expect(contractFactorySpy.calledOnce).to.be.true
            expect(saveSpy.calledOnce).to.be.true

            const savedDeployment = saveSpy.getCall(0).args[1]
            expect(savedDeployment).to.have.property('abi').that.eql(mockAbi)
            expect(savedDeployment).to.have.property('bytecode', mockBytecode)

            // Check if newlyDeployed is true
            expect(result.newlyDeployed).to.be.true
        })

        it('should reuse existing deployment when bytecode is the same', async () => {
            const deploymentName = 'MockContractDeployment'
            const overrides = {
                gasPrice: await ethers.provider.getGasPrice(),
            }

            // Mock `getOrNull` to simulate an existing deployment with the same bytecode
            getOrNullStub.resolves({
                address: mockContract.address,
                bytecode: mockBytecode, // Existing deployment has the same bytecode
            } as any)

            // Call the deploy helper function
            const result = await deploy({
                hre,
                contractName: 'MockContract',
                deploymentName,
                overrides,
                abi: mockAbi,
                creationBytecode: mockBytecode,
                signer: owner,
                logger: loggerMock,
                libraries: {},
                args: [],
                metadata: mockMetadata,
            })

            // Check that no redeployment occurred
            expect(contractFactorySpy.called).to.be.false
            expect(saveSpy.called).to.be.false

            // Check if newlyDeployed is false
            expect(result.newlyDeployed).to.be.false
        })

        it('should deploy a proxy contract and call implementation functions', async () => {
            const proxyDeploymentName = 'FiatTokenProxy'
            const implDeploymentName = 'FiatTokenV2_2'
            const overrides = {
                gasPrice: await ethers.provider.getGasPrice(),
            }

            // Deploy Implementation (Mock FiatTokenV2_2)
            const implDeployment = await deploy({
                hre,
                contractName: implDeploymentName,
                deploymentName: implDeploymentName,
                overrides,
                abi: mockAbi,
                creationBytecode: mockBytecode,
                signer: owner,
                logger: loggerMock,
                libraries: {},
                args: [],
                metadata: mockMetadata,
            })

            expect(implDeployment.newlyDeployed).to.be.true

            const code = await ethers.provider.getCode(implDeployment.address)
            if (code === '0x') {
                throw new Error('The provided implementation address is not a contract')
            }

            // Deploy Proxy (Mock FiatTokenProxy)
            const proxyBytecode =
                '608060405234801561001057600080fd5b506040516108a93803806108a98339818101604052602081101561003357600080fd5b5051808061004081610051565b5061004a336100c3565b5050610123565b610064816100e760201b61042a1760201c565b61009f5760405162461bcd60e51b815260040180806020018281038252603b81526020018061086e603b913960400191505060405180910390fd5b7f7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c355565b7f10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b55565b6000813f7fc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a47081811480159061011b57508115155b949350505050565b61073c806101326000396000f3fe60806040526004361061005a5760003560e01c80635c60da1b116100435780635c60da1b146101315780638f2839701461016f578063f851a440146101af5761005a565b80633659cfe6146100645780634f1ef286146100a4575b6100626101c4565b005b34801561007057600080fd5b506100626004803603602081101561008757600080fd5b503573ffffffffffffffffffffffffffffffffffffffff166101de565b610062600480360360408110156100ba57600080fd5b73ffffffffffffffffffffffffffffffffffffffff82351691908101906040810160208201356401000000008111156100f257600080fd5b82018360208201111561010457600080fd5b8035906020019184600183028401116401000000008311171561012657600080fd5b509092509050610232565b34801561013d57600080fd5b50610146610309565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b34801561017b57600080fd5b506100626004803603602081101561019257600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16610318565b3480156101bb57600080fd5b50610146610420565b6101cc610466565b6101dc6101d76104fa565b61051f565b565b6101e6610543565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614156102275761022281610568565b61022f565b61022f6101c4565b50565b61023a610543565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614156102fc5761027683610568565b60003073ffffffffffffffffffffffffffffffffffffffff16348484604051808383808284376040519201945060009350909150508083038185875af1925050503d80600081146102e3576040519150601f19603f3d011682016040523d82523d6000602084013e6102e8565b606091505b50509050806102f657600080fd5b50610304565b6103046101c4565b505050565b60006103136104fa565b905090565b610320610543565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614156102275773ffffffffffffffffffffffffffffffffffffffff81166103bf576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260368152602001806106966036913960400191505060405180910390fd5b7f7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f6103e8610543565b6040805173ffffffffffffffffffffffffffffffffffffffff928316815291841660208301528051918290030190a1610222816105bd565b6000610313610543565b6000813f7fc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a47081811480159061045e57508115155b949350505050565b61046e610543565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614156104f2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260328152602001806106646032913960400191505060405180910390fd5b6101dc6101dc565b7f7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c35490565b3660008037600080366000845af43d6000803e80801561053e573d6000f35b3d6000fd5b7f10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b5490565b610571816105e1565b6040805173ffffffffffffffffffffffffffffffffffffffff8316815290517fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b9181900360200190a150565b7f10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b55565b6105ea8161042a565b61063f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603b8152602001806106cc603b913960400191505060405180910390fd5b7f7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c35556fe43616e6e6f742063616c6c2066616c6c6261636b2066756e6374696f6e2066726f6d207468652070726f78792061646d696e43616e6e6f74206368616e6765207468652061646d696e206f6620612070726f787920746f20746865207a65726f206164647265737343616e6e6f742073657420612070726f787920696d706c656d656e746174696f6e20746f2061206e6f6e2d636f6e74726163742061646472657373a2646970667358221220119e941d353783c92238fbc4e38a3a0327e471d10cff47c0a5066819d4a4195664736f6c634300060c003343616e6e6f742073657420612070726f787920696d706c656d656e746174696f6e20746f2061206e6f6e2d636f6e74726163742061646472657373000000000000000000000000' +
                implDeployment.address.slice(2)
            const mockProxyAbi = [
                {
                    inputs: [
                        {
                            internalType: 'address',
                            name: 'implementationContract',
                            type: 'address',
                        },
                    ],
                    stateMutability: 'nonpayable',
                    type: 'constructor',
                },
                {
                    anonymous: false,
                    inputs: [
                        {
                            indexed: false,
                            internalType: 'address',
                            name: 'previousAdmin',
                            type: 'address',
                        },
                        {
                            indexed: false,
                            internalType: 'address',
                            name: 'newAdmin',
                            type: 'address',
                        },
                    ],
                    name: 'AdminChanged',
                    type: 'event',
                },
                {
                    anonymous: false,
                    inputs: [
                        {
                            indexed: false,
                            internalType: 'address',
                            name: 'implementation',
                            type: 'address',
                        },
                    ],
                    name: 'Upgraded',
                    type: 'event',
                },
                { stateMutability: 'payable', type: 'fallback' },
                {
                    inputs: [],
                    name: 'admin',
                    outputs: [{ internalType: 'address', name: '', type: 'address' }],
                    stateMutability: 'view',
                    type: 'function',
                },
                {
                    inputs: [{ internalType: 'address', name: 'newAdmin', type: 'address' }],
                    name: 'changeAdmin',
                    outputs: [],
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
                {
                    inputs: [],
                    name: 'implementation',
                    outputs: [{ internalType: 'address', name: '', type: 'address' }],
                    stateMutability: 'view',
                    type: 'function',
                },
                {
                    inputs: [
                        {
                            internalType: 'address',
                            name: 'newImplementation',
                            type: 'address',
                        },
                    ],
                    name: 'upgradeTo',
                    outputs: [],
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
                {
                    inputs: [
                        {
                            internalType: 'address',
                            name: 'newImplementation',
                            type: 'address',
                        },
                        { internalType: 'bytes', name: 'data', type: 'bytes' },
                    ],
                    name: 'upgradeToAndCall',
                    outputs: [],
                    stateMutability: 'payable',
                    type: 'function',
                },
            ]
            const proxyDeployment = await deploy({
                hre,
                contractName: proxyDeploymentName,
                deploymentName: proxyDeploymentName,
                overrides,
                abi: mockProxyAbi,
                creationBytecode: proxyBytecode,
                signer: owner,
                logger: loggerMock,
                libraries: {},
                args: [implDeployment.address],
                metadata: mockMetadata,
            })

            // Ensure proxy is deployed
            expect(proxyDeployment.newlyDeployed).to.be.true

            const proxyWithImplAbi = await hre.ethers.getContractAt(
                implDeployment.abi, // Use the ABI of the implementation
                proxyDeployment.address,
                endpointOwner // proxy admin cannot call fallback function
            )

            // Call functions on proxy as if they were from the implementation
            const digest = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test'))
            const signature = await endpointOwner.signMessage(ethers.utils.arrayify(digest))
            const isValidSignatureNow = await proxyWithImplAbi.functions.isValidSignatureNow(
                owner.address,
                digest, // bytes32 digest
                signature // Mock signing the digest
            )

            expect(isValidSignatureNow).to.not.eql(undefined)
        })
    })
})

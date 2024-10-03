import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat' // Import ethers from Hardhat, not directly from ethers.js
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import sinon from 'sinon'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { appendDependencies, appendTags, deploy, fillAddress, saveDeployment } from '../../ts-src/utils/helpers'

describe('deploy/helpers', () => {
    let saveSpy: sinon.SinonSpy
    let contractFactorySpy: sinon.SinonSpy

    const mockAbi = [
        { constant: true, inputs: [], name: 'mock', outputs: [{ name: '', type: 'uint256' }], type: 'function' },
    ]
    const mockBytecode = '0x600a600c600e600f'

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
            })

            const savedDeployment = saveSpy.getCall(0).args[1]
            expect(savedDeployment.metadata).to.be.a('string')

            if (savedDeployment.metadata) {
                const metadata = JSON.parse(savedDeployment.metadata)

                expect(metadata).to.have.property('language', 'solidity')
                expect(metadata).to.have.property('compiler').that.is.an('object')
                expect(metadata.compiler).to.have.property('version', '0.6.12+commit.27d51765')
                expect(metadata).to.have.property('settings').that.is.an('object')
                expect(metadata.settings).to.have.property('evmVersion', 'istanbul')
            }
        })
    })

    describe('deploy', () => {
        beforeEach(async () => {
            sinon.restore()
            // Spy on the deployment process
            saveSpy = sinon.spy(hre.deployments, 'save')
            contractFactorySpy = sinon.spy(ContractFactory.prototype, 'deploy')
        })

        afterEach(() => {
            sinon.restore() // Restore sinon after each test to avoid re-wrapping
        })

        it('should deploy the contract with the correct bytecode and ABI', async () => {
            const deploymentName = 'MockContractDeployment'
            const overrides = {
                gasPrice: await ethers.provider.getGasPrice(),
            }

            // Call the deploy helper function
            await deploy({
                hre,
                deploymentName,
                overrides,
                abi: mockAbi,
                creationBytecode: mockBytecode,
                signer: owner,
                logger: loggerMock,
            })

            // Check if the contract was deployed with correct ABI and bytecode
            expect(contractFactorySpy.calledOnce).to.be.true
            expect(contractFactorySpy.args[0][0]).to.eql(overrides)

            // Check if the deployment was saved correctly
            expect(saveSpy.calledOnce).to.be.true
            const savedDeployment = saveSpy.getCall(0).args[1]
            expect(savedDeployment).to.have.property('abi').that.eql(mockAbi)
            expect(savedDeployment).to.have.property('bytecode', mockBytecode)
        })
    })
})

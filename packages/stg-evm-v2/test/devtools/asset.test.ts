import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Asset } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { makeBytes20 } from './utils'

describe('Asset/sdk', () => {
    // Declaration of variables to be used in the test suite
    let endpointV2Mock: ContractFactory
    let myAsset: Contract
    let owner: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let mockEndpoint: Contract
    let sdk: Asset

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner, endpointOwner] = await ethers.getSigners()

        // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
        // and its artifacts are connected as external artifacts to this project
        //
        // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts,
        // so we rely on hardhat-deploy to create a ContractFactory for EndpointV2Mock
        //
        // See https://github.com/NomicFoundation/hardhat/issues/1040
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        endpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpoint = await endpointV2Mock.deploy(EndpointId.ETHEREUM_V2_SANDBOX)

        // Deploying an instance of the Stargate contract and linking it to the mock LZEndpoint
        myAsset = await (
            await ethers.getContractFactory('StargatePool')
        ).deploy('USDC LP Token', 'USDCLP', mockEndpoint.address, 18, 6, mockEndpoint.address, owner.address)

        sdk = new Asset({ eid: EndpointId.ETHEREUM_V2_SANDBOX, contract: myAsset })
    })

    describe('setAddressConfig', () => {
        it('should set the roles', async () => {
            await sdk.getAddressConfig()

            expect(await sdk.getAddressConfig()).to.deep.equal({
                feeLib: ethers.constants.AddressZero,
                planner: ethers.constants.AddressZero,
                treasurer: ethers.constants.AddressZero,
                tokenMessaging: ethers.constants.AddressZero,
                creditMessaging: ethers.constants.AddressZero,
                lzToken: ethers.constants.AddressZero,
            })

            const newConfig = {
                feeLib: makeBytes20('0x01'),
                planner: makeBytes20('0x02'),
                treasurer: makeBytes20('0x03'),
                tokenMessaging: makeBytes20('0x04'),
                creditMessaging: makeBytes20('0x05'),
                lzToken: makeBytes20('0x06'),
            }

            const tx = await sdk.setAddressConfig(newConfig)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getAddressConfig()).to.deep.equal(newConfig)
        })
    })

    describe('isOFTPath', () => {
        it('should return false if unset', async () => {
            expect(await sdk.isOFTPath(EndpointId.ETHEREUM_V2_SANDBOX)).to.equal(false)
        })
    })

    describe('setOFTPath', () => {
        it('should set the OFT path', async () => {
            const tx = await sdk.setOFTPath(EndpointId.APTOS_SANDBOX, true)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.isOFTPath(EndpointId.APTOS_SANDBOX)).to.equal(true)
        })
    })

    describe('isPaused', () => {
        it('should return false if unset', async () => {
            expect(await sdk.isPaused()).to.equal(false)
        })
    })

    describe('setPaused', () => {
        it('should set the paused status', async () => {
            const newConfig = {
                feeLib: makeBytes20('0x01'),
                planner: makeBytes20(owner.address),
                treasurer: makeBytes20('0x03'),
                tokenMessaging: makeBytes20('0x04'),
                creditMessaging: makeBytes20('0x05'),
                lzToken: makeBytes20('0x06'),
            }

            const txSetPlanner = await sdk.setAddressConfig(newConfig)
            await owner.sendTransaction({
                to: txSetPlanner.point.address,
                data: txSetPlanner.data,
            })

            const tx = await sdk.setPaused(true)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.isPaused()).to.equal(true)
        })
    })
})

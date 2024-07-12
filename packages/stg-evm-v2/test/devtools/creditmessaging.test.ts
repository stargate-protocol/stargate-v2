import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CreditMessaging } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'
import { Address } from 'hardhat-deploy/dist/types'

import { OmniContractFactory } from '@layerzerolabs/devtools-evm'
import { createContractFactory } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { createEndpointV2Factory } from '@layerzerolabs/protocol-devtools-evm'

const assetId = 1
const gasLimit = 2n
const dstEid = EndpointId.APTOS_SANDBOX

describe('CreditMessaging/sdk', () => {
    // Declaration of variables to be used in the test suite
    let endpointV2Mock: ContractFactory
    let myCreditMessaging: Contract
    let contractFactory: OmniContractFactory
    let owner: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let planner: SignerWithAddress
    let mockEndpoint: Contract
    let someStargateAddress: Address
    let sdk: CreditMessaging

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner, endpointOwner, planner, { address: someStargateAddress }] = await ethers.getSigners()

        // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
        // and its artifacts are connected as external artifacts to this project
        //
        // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts,
        // so we rely on hardhat-deploy to create a ContractFactory for EndpointV2Mock
        //
        // See https://github.com/NomicFoundation/hardhat/issues/1040
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        endpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)

        contractFactory = createContractFactory()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpoint = await endpointV2Mock.deploy(EndpointId.ETHEREUM_V2_SANDBOX)

        // Deploying an instance of the CreditMessaging contract and linking it to the mock LZEndpoint
        myCreditMessaging = await (
            await ethers.getContractFactory('CreditMessaging')
        ).deploy(mockEndpoint.address, owner.address)

        sdk = new CreditMessaging(
            { eid: EndpointId.ETHEREUM_V2_SANDBOX, contract: myCreditMessaging },
            createEndpointV2Factory(contractFactory)
        )
    })

    describe('getPlanner', () => {
        it('should return undefined if unset', async () => {
            expect(await sdk.getPlanner()).to.equal(undefined)
        })
    })

    describe('setPlanner', () => {
        it('should set the planner', async () => {
            const tx = await sdk.setPlanner(planner.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getPlanner()).to.equal(planner.address)
        })
    })

    describe('setAssetId', () => {
        it('should set the asset id for a stargate', async () => {
            const tx = await sdk.setAssetId(someStargateAddress, assetId)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getAssetId(someStargateAddress)).to.equal(assetId)
            expect(await sdk.getAsset(assetId)).to.equal(someStargateAddress)
        })
    })

    describe('setMaxAssetId', () => {
        it('should set the max asset id', async () => {
            const tx = await sdk.setMaxAssetId(assetId)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getMaxAssetId()).to.equal(assetId)
        })
    })

    describe('setGasLimit', () => {
        it('should set the gas limit', async () => {
            const tx = await sdk.setGasLimit(dstEid, gasLimit)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getGasLimit(dstEid)).to.equal(gasLimit)
        })
    })
})

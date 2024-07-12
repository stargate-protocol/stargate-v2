import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { TokenMessaging } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { TokenMessagingGasLimits } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'
import { Address } from 'hardhat-deploy/dist/types'

import { OmniContractFactory } from '@layerzerolabs/devtools-evm'
import { createContractFactory } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { createEndpointV2Factory } from '@layerzerolabs/protocol-devtools-evm'

const busSize = 128
const busFare = 100n
const busAndNativeDropFare = 200n
const assetId = 1
const dstEid = EndpointId.APTOS_SANDBOX

describe('TokenMessaging/sdk', () => {
    // Declaration of variables to be used in the test suite
    let endpointV2Mock: ContractFactory
    let myTokenMessaging: Contract
    let contractFactory: OmniContractFactory
    let owner: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let planner: SignerWithAddress
    let mockEndpoint: Contract
    let someStargateAddress: Address
    let sdk: TokenMessaging

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

        // Deploying an instance of the TokenMessaging contract and linking it to the mock LZEndpoint
        myTokenMessaging = await (
            await ethers.getContractFactory('TokenMessaging')
        ).deploy(mockEndpoint.address, owner.address, busSize)

        sdk = new TokenMessaging(
            { eid: EndpointId.ETHEREUM_V2_SANDBOX, contract: myTokenMessaging },
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

    describe('setFares', () => {
        it('should set the bus and nativeDrop fare', async () => {
            let fares = await sdk.getFares(dstEid)
            expect(fares.busFare).to.equal(0)
            expect(fares.busAndNativeDropFare).to.equal(0)

            const txPlanner = await sdk.setPlanner(planner.address)
            await owner.sendTransaction({
                to: txPlanner.point.address,
                data: txPlanner.data,
            })

            const txFares = await sdk.setFares(dstEid, {
                busFare: busFare,
                busAndNativeDropFare: busAndNativeDropFare,
            })
            await planner.sendTransaction({
                to: txFares.point.address,
                data: txFares.data,
            })

            fares = await sdk.getFares(dstEid)
            expect(fares.busFare).to.equal(busFare)
            expect(fares.busAndNativeDropFare).to.equal(busAndNativeDropFare)
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
        it('should set the asset id for a stargate', async () => {
            const tx = await sdk.setMaxAssetId(assetId)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getMaxAssetId()).to.equal(assetId)
        })
    })

    describe('setMaxPassengers', () => {
        it('should set the max passengers for a destination endpoint', async () => {
            const tx = await sdk.setMaxPassengers(dstEid, busSize - 2)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getMaxPassengers(dstEid)).to.deep.equal(busSize - 2)
        })
    })

    describe('setGasLimit', () => {
        it('should set the gas limit for an asset on a chain', async () => {
            const gasLimit: TokenMessagingGasLimits = {
                gasLimit: 150000n,
                nativeDropGasLimit: 150000n,
            }
            const tx = await sdk.setGasLimit(dstEid, gasLimit)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getGasLimit(dstEid)).to.eql(gasLimit)
        })
    })

    describe('setNativeDropAmount', () => {
        it('should set the native drop amount for an asset on a chain', async () => {
            const nativeDropAmount = 100n
            const tx = await sdk.setNativeDropAmount(dstEid, nativeDropAmount)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getNativeDropAmount(dstEid)).to.equal(nativeDropAmount)
        })
    })

    describe('getQueueCapacity', () => {
        it('returns the bus capacity', async () => {
            const queueCapacity = await sdk.getQueueCapacity()

            expect(queueCapacity).to.equal(busSize)
        })
    })

    describe('initializeBusQueueStorage', () => {
        it('should write to storage', async () => {
            const originalStorage = []
            for (let slot = 0n; slot < busSize; slot++) {
                originalStorage.push(await sdk.getPassengerHash(EndpointId.ETHEREUM_V2_SANDBOX, slot))
            }

            const tx = await sdk.initializeBusQueueStorage([EndpointId.ETHEREUM_V2_SANDBOX], 0n, BigInt(busSize))
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            const initializedStorage = []
            for (let slot = 0n; slot < busSize; slot++) {
                initializedStorage.push(await sdk.getPassengerHash(EndpointId.ETHEREUM_V2_SANDBOX, slot))
            }

            expect(initializedStorage).to.not.deep.equal(originalStorage)
        })
    })
})

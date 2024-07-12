import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createTokenMessagingFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    TokenMessagingEdgeConfig,
    TokenMessagingNodeConfig,
    TokenMessagingOmniGraph,
    configureTokenMessaging,
    initializeBusQueueStorage,
} from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

const busSize = 128
const busFare = 100n
const busAndNativeDropFare = 200n
const maxAssetId = 10
const nativeDropAmount = 100000000000000000n
const dstEid = EndpointId.APTOS_SANDBOX

describe('TokenMessaging/configurator', () => {
    // Declaration of variables to be used in the test suite
    let endpointV2Mock: ContractFactory
    let myTokenMessaging: Contract
    let otherTokenMessaging: Contract
    let owner: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let mockEndpoint: Contract

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

        // Deploying an instance of the TokenMessaging contract and linking it to the mock LZEndpoint
        myTokenMessaging = await (
            await ethers.getContractFactory('TokenMessaging')
        ).deploy(mockEndpoint.address, owner.address, busSize)

        otherTokenMessaging = await (
            await ethers.getContractFactory('TokenMessaging')
        ).deploy(mockEndpoint.address, owner.address, busSize)
    })

    it('should configure the contract', async () => {
        const sdkFactory = createTokenMessagingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myTokenMessaging.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenMessaging.address,
        }
        const remotePoint: OmniPoint = {
            eid: dstEid,
            address: otherTokenMessaging.address,
        }
        const graph: TokenMessagingOmniGraph = new OmniGraphBuilder<
            TokenMessagingNodeConfig,
            TokenMessagingEdgeConfig
        >()
            .addNodes({
                point: myPoint,
                config: {
                    maxAssetId: maxAssetId,
                    planner: owner.address, // Set the planner to the owner, so we can have a single signer
                },
            })
            .addNodes({
                point: remotePoint,
                config: {
                    maxAssetId: maxAssetId,
                    planner: owner.address,
                },
            })
            .addEdges({
                vector: {
                    from: myPoint,
                    to: remotePoint,
                },
                config: {
                    maxPassengers: busSize - 2,
                    fares: {
                        busFare,
                        busAndNativeDropFare,
                    },
                    gasLimit: {
                        gasLimit: 150000n,
                        nativeDropGasLimit: 150000n,
                    },
                    nativeDropAmount,
                },
            }).graph

        const configTxs = await configureTokenMessaging(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner
                .sendTransaction({
                    to: configTxs[i].point.address,
                    data: configTxs[i].data,
                })
                .then((r) => r.wait())
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myTokenMessaging.address })

        expect(await sdk.getPlanner()).to.equal(owner.address)
        const fares = await sdk.getFares(dstEid)
        expect(fares.busFare).to.equal(busFare)
        expect(fares.busAndNativeDropFare).to.equal(busAndNativeDropFare)
        //expect(await sdk.getPeer(dstEid)).to.equal(remotePoint.address)
        expect(await sdk.getMaxAssetId()).to.equal(maxAssetId)
        expect(await sdk.getMaxPassengers(dstEid)).to.equal(busSize - 2)
        expect(await sdk.getGasLimit(dstEid)).to.eql({
            gasLimit: 150000n,
            nativeDropGasLimit: 150000n,
        })
        expect(await sdk.getNativeDropAmount(dstEid)).to.equal(nativeDropAmount)
    })

    it('should initialize the storage', async () => {
        const sdkFactory = createTokenMessagingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myTokenMessaging.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenMessaging.address,
        }
        const remotePoint: OmniPoint = {
            eid: dstEid,
            address: otherTokenMessaging.address,
        }
        const graph: TokenMessagingOmniGraph = new OmniGraphBuilder<
            TokenMessagingNodeConfig,
            TokenMessagingEdgeConfig
        >()
            .addNodes({
                point: myPoint,
                config: {
                    maxAssetId: maxAssetId,
                    planner: owner.address, // Set the planner to the owner, so we can have a single signer
                },
            })
            .addNodes({
                point: remotePoint,
                config: {
                    maxAssetId: maxAssetId,
                    planner: owner.address,
                },
            })
            .addEdges({
                vector: {
                    from: myPoint,
                    to: remotePoint,
                },
                config: {
                    maxPassengers: busSize - 2,
                },
            }).graph

        const configTxs = await initializeBusQueueStorage(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myTokenMessaging.address })
        for (let i = 0n; i < busSize; i++) expect(await sdk.getPassengerHash(dstEid, i)).to.not.be.undefined
    })

    it('should return no Txs when configurations match', async () => {
        const sdkFactory = createTokenMessagingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myTokenMessaging.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenMessaging.address,
        }
        const remotePoint: OmniPoint = {
            eid: dstEid,
            address: otherTokenMessaging.address,
        }
        const graph: TokenMessagingOmniGraph = new OmniGraphBuilder<
            TokenMessagingNodeConfig,
            TokenMessagingEdgeConfig
        >()
            .addNodes({
                point: myPoint,
                config: {
                    maxAssetId: maxAssetId,
                    planner: owner.address, // Set the planner to the owner, so we can have a single signer
                },
            })
            .addNodes({
                point: remotePoint,
                config: {
                    maxAssetId: maxAssetId,
                    planner: owner.address,
                },
            })
            .addEdges({
                vector: {
                    from: myPoint,
                    to: remotePoint,
                },
                config: {
                    maxPassengers: busSize - 2,
                    fares: {
                        busFare,
                        busAndNativeDropFare,
                    },
                },
            }).graph as TokenMessagingOmniGraph

        const configTxs = await configureTokenMessaging(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureTokenMessaging(graph, sdkFactory)).to.be.empty
    })
})

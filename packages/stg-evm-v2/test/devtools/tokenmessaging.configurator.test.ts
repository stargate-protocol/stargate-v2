import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createTokenMessagingFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    TokenMessagingEdgeConfig,
    TokenMessagingNodeConfig,
    TokenMessagingOmniGraph,
    configureFares,
    configureMaxNumPassengers,
    configureMessagingWithoutPeers,
    configureNativeDropAmount,
    configureTokenMessaging,
    configureTokenMessagingGasLimit,
    configureUnpeerEdges,
    initializeBusQueueStorage,
} from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint, createConfigureMultiple } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { Options } from '@layerzerolabs/lz-v2-utilities'

import { generateTokenMessagingConfig } from '../../devtools/config/utils'

const busSize = 128
const busFare = 100n
const busAndNativeDropFare = 200n
const maxAssetId = 10
const nativeDropAmount = 100000000000000000n
const dstEid = EndpointId.APTOS_SANDBOX
const configureTokenMessagingUnwire = createConfigureMultiple(
    configureMessagingWithoutPeers,
    configureTokenMessagingGasLimit,
    configureMaxNumPassengers,
    configureFares,
    configureNativeDropAmount,
    configureUnpeerEdges
)

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

    for (const legacy of [false, true]) {
        it(`should preserve ${legacy ? 'existing' : 'unset'} bus settings when wiring taxi after deprecation`, async () => {
            const myPoint = { eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myTokenMessaging.address }
            const remotePoint = { eid: EndpointId.BSC_V2_SANDBOX, address: otherTokenMessaging.address }
            const edge = generateTokenMessagingConfig([myPoint, remotePoint]).find(
                ({ from }) => from.eid === myPoint.eid
            )
            if (edge?.config == null) throw new Error('Missing generated TokenMessaging edge')
            const graph: TokenMessagingOmniGraph = {
                contracts: [{ point: myPoint, config: {} }],
                connections: [
                    {
                        vector: { from: myPoint, to: remotePoint },
                        // Transport security configuration is outside this bus/taxi regression test.
                        config: { ...edge.config, sendConfig: undefined, receiveConfig: undefined },
                    },
                ],
            }
            const sdkFactory = createTokenMessagingFactory(({ eid, address }: OmniPoint) => ({
                eid,
                contract: myTokenMessaging.attach(address),
            }))
            const sdk = await sdkFactory(myPoint)
            await myTokenMessaging.setPeer(remotePoint.eid, ethers.utils.hexZeroPad(remotePoint.address, 32))
            const busOptions = Options.newOptions().addExecutorLzReceiveOption(38000).toHex()
            if (legacy) {
                await myTokenMessaging.setGasLimit(remotePoint.eid, 60000, 25000)
                await myTokenMessaging.setNativeDropAmount(remotePoint.eid, nativeDropAmount)
                await myTokenMessaging.setEnforcedOptions([
                    { eid: remotePoint.eid, msgType: 2, options: busOptions },
                    {
                        eid: remotePoint.eid,
                        msgType: 1,
                        options: Options.newOptions().addExecutorLzReceiveOption(150000).toHex(),
                    },
                ])
            }

            const configure = configureTokenMessaging
            const txs = await configure(graph, sdkFactory)
            // Existing deployments need no changes; a fresh deployment only needs taxi options.
            expect(txs).to.have.length(legacy ? 0 : 1)
            for (const tx of txs) {
                const call = myTokenMessaging.interface.parseTransaction({ data: tx.data })
                expect(call.name).to.equal('setEnforcedOptions')
                expect(call.args[0]).to.have.length(1)
                expect(call.args[0][0].msgType).to.equal(1)
                await owner.sendTransaction({ to: tx.point.address, data: tx.data }).then((receipt) => receipt.wait())
            }

            expect(await sdk.getGasLimit(remotePoint.eid)).to.deep.equal({
                gasLimit: legacy ? 60000n : 0n,
                nativeDropGasLimit: legacy ? 25000n : 0n,
            })
            expect(await sdk.getNativeDropAmount(remotePoint.eid)).to.equal(legacy ? nativeDropAmount : 0n)
            expect(await sdk.getEnforcedOptions(remotePoint.eid, 2)).to.equal(legacy ? busOptions : '0x')
            expect(await sdk.getFares(remotePoint.eid)).to.deep.equal({ busFare: 0n, busAndNativeDropFare: 0n })
            expect(await sdk.getMaxPassengers(remotePoint.eid)).to.equal(0)
            expect(await initializeBusQueueStorage(graph, sdkFactory)).to.deep.equal([])
            expect(await configure(graph, sdkFactory)).to.deep.equal([])
        })
    }

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

    for (const maxPassengers of [undefined, 0]) {
        it(`should ${maxPassengers === 0 ? 'skip' : 'initialize'} storage when maxPassengers is ${maxPassengers}`, async () => {
            const sdkFactory = createTokenMessagingFactory(({ eid, address }: OmniPoint) => ({
                eid,
                contract: myTokenMessaging.attach(address),
            }))
            const myPoint: OmniPoint = {
                eid: EndpointId.ETHEREUM_V2_SANDBOX,
                address: myTokenMessaging.address,
            }
            const remotePoint: OmniPoint = { eid: dstEid, address: otherTokenMessaging.address }
            const graph: TokenMessagingOmniGraph = {
                contracts: [{ point: myPoint, config: {} }],
                connections: [{ vector: { from: myPoint, to: remotePoint }, config: { maxPassengers } }],
            }
            await myTokenMessaging.setMaxNumPassengers(dstEid, busSize - 2)

            const configTxs = await initializeBusQueueStorage(graph, sdkFactory)
            expect(configTxs).to.have.length(maxPassengers === 0 ? 0 : 2)
            for (const tx of configTxs) {
                await owner.sendTransaction({ to: tx.point.address, data: tx.data })
            }
            const sdk = await sdkFactory(myPoint)
            expect(await sdk.getPassengerHash(dstEid, BigInt(busSize - 1))).to.satisfy((hash: string | undefined) =>
                maxPassengers === 0 ? hash == null : hash != null
            )
        })
    }

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

    it('should unwire without recreating an already-zero peer', async () => {
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
                    planner: owner.address,
                },
            })
            .addEdges({
                vector: {
                    from: myPoint,
                    to: remotePoint,
                },
                config: {
                    gasLimit: {
                        gasLimit: 150000n,
                        nativeDropGasLimit: 150000n,
                    },
                },
            }).graph

        const sdk = await sdkFactory(myPoint)
        expect(await sdk.hasPeer(dstEid, null)).to.equal(true)

        const configTxs = await configureTokenMessagingUnwire(graph, sdkFactory)
        for (const tx of configTxs) {
            await owner
                .sendTransaction({
                    to: tx.point.address,
                    data: tx.data,
                })
                .then((r) => r.wait())
        }

        expect(await sdk.hasPeer(dstEid, null)).to.equal(true)
        expect(await sdk.getGasLimit(dstEid)).to.eql({
            gasLimit: 150000n,
            nativeDropGasLimit: 150000n,
        })
    })
})

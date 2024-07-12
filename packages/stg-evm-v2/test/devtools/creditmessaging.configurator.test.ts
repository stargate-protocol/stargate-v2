import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createCreditMessagingFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    CreditMessagingEdgeConfig,
    CreditMessagingNodeConfig,
    CreditMessagingOmniGraph,
    configureCreditMessaging,
} from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

const gasLimit = 2n
const maxAssetId = 10
const dstEid = EndpointId.APTOS_SANDBOX

describe('CreditMessaging/configurator', () => {
    // Declaration of variables to be used in the test suite
    let endpointV2Mock: ContractFactory
    let myCreditMessaging: Contract
    let otherCreditMessaging: Contract
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

        // Deploying an instance of the CreditMessaging contract and linking it to the mock LZEndpoint
        myCreditMessaging = await (
            await ethers.getContractFactory('CreditMessaging')
        ).deploy(mockEndpoint.address, owner.address)

        otherCreditMessaging = await (
            await ethers.getContractFactory('CreditMessaging')
        ).deploy(mockEndpoint.address, owner.address)
    })

    it('should configure the contract', async () => {
        const sdkFactory = createCreditMessagingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myCreditMessaging.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myCreditMessaging.address,
        }
        const remotePoint: OmniPoint = {
            eid: dstEid,
            address: otherCreditMessaging.address,
        }
        const graph: CreditMessagingOmniGraph = new OmniGraphBuilder()
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
                    peer: remotePoint.address,
                    gasLimit: gasLimit,
                },
            }).graph as CreditMessagingOmniGraph

        const configTxs = await configureCreditMessaging(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myCreditMessaging.address })
        expect(await sdk.getPlanner()).to.equal(owner.address)
        expect(await sdk.getGasLimit(dstEid)).to.equal(gasLimit)
    })

    it('should return no Txs when configurations match', async () => {
        const sdkFactory = createCreditMessagingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myCreditMessaging.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myCreditMessaging.address,
        }
        const remotePoint: OmniPoint = {
            eid: dstEid,
            address: otherCreditMessaging.address,
        }
        const graph: CreditMessagingOmniGraph = new OmniGraphBuilder<
            CreditMessagingNodeConfig,
            CreditMessagingEdgeConfig
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
                    gasLimit: gasLimit,
                },
            }).graph

        const configTxs = await configureCreditMessaging(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureCreditMessaging(graph, sdkFactory)).to.be.empty
    })
})

import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createAssetFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { AssetOmniGraph, configureAsset } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { makeBytes20 } from './utils'

describe('Asset/configurator', () => {
    // Declaration of variables to be used in the test suite
    let endpointV2Mock: ContractFactory
    let myAsset: Contract
    let otherAsset: Contract
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

        // Deploying an instance of the Stargate contract and linking it to the mock LZEndpoint
        myAsset = await (
            await ethers.getContractFactory('StargatePool')
        ).deploy('USDC LP Token', 'USDCLP', mockEndpoint.address, 18, 6, mockEndpoint.address, owner.address)

        otherAsset = await (
            await ethers.getContractFactory('StargatePool')
        ).deploy('USDC LP Token', 'USDCLP', mockEndpoint.address, 18, 6, mockEndpoint.address, owner.address)
    })

    it('should configure the contract', async () => {
        const sdkFactory = createAssetFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myAsset.attach(address),
        }))
        const newConfig = {
            feeLib: makeBytes20('0x01'),
            planner: makeBytes20(owner.address),
            treasurer: makeBytes20('0x03'),
            tokenMessaging: makeBytes20('0x04'),
            creditMessaging: makeBytes20('0x05'),
            lzToken: makeBytes20('0x06'),
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myAsset.address,
        }
        const remotePoint: OmniPoint = {
            eid: EndpointId.APTOS_SANDBOX,
            address: otherAsset.address,
        }
        const graph: AssetOmniGraph = new OmniGraphBuilder()
            .addNodes({
                point: myPoint,
                config: {
                    addressConfig: newConfig,
                },
            })
            .addNodes({
                point: remotePoint,
                config: {
                    addressConfig: newConfig,
                },
            })
            .addEdges({
                vector: {
                    from: myPoint,
                    to: remotePoint,
                },
                config: {
                    isOFT: true,
                },
            }).graph as AssetOmniGraph

        const configTxs = await configureAsset(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myAsset.address })
        expect(await sdk.getAddressConfig()).to.deep.equal(newConfig)
        expect(await sdk.isOFTPath(EndpointId.APTOS_SANDBOX)).to.equal(true)
    })

    it('should return no Txs when configuration matches', async () => {
        const sdkFactory = createAssetFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myAsset.attach(address),
        }))
        const newConfig = {
            feeLib: makeBytes20('0x01'),
            planner: makeBytes20(owner.address),
            treasurer: makeBytes20('0x03'),
            tokenMessaging: makeBytes20('0x04'),
            creditMessaging: makeBytes20('0x05'),
            lzToken: makeBytes20('0x06'),
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myAsset.address,
        }
        const remotePoint: OmniPoint = {
            eid: EndpointId.APTOS_SANDBOX,
            address: otherAsset.address,
        }
        const graph: AssetOmniGraph = new OmniGraphBuilder()
            .addNodes({
                point: myPoint,
                config: {
                    addressConfig: newConfig,
                },
            })
            .addNodes({
                point: remotePoint,
                config: {
                    addressConfig: newConfig,
                },
            })
            .addEdges({
                vector: {
                    from: myPoint,
                    to: remotePoint,
                },
                config: {
                    isOFT: true,
                },
            }).graph as AssetOmniGraph

        const configTxs = await configureAsset(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureAsset(graph, sdkFactory)).to.empty
    })
})

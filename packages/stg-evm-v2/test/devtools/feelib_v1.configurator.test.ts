import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createFeeLibV1Factory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { FeeConfig, FeeLibV1OmniGraph, configureFeeLibV1 } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

const dstEid = EndpointId.APTOS_SANDBOX

describe('FeeLibV1/configurator', () => {
    // Declaration of variables to be used in the test suite
    let endpointV2Mock: ContractFactory
    let myFeeLib: Contract
    let otherFeeLib: Contract
    let myStargate: Contract
    let otherStargate: Contract
    let mockEndpoint: Contract
    let owner: SignerWithAddress
    let endpointOwner: SignerWithAddress

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

        // Deploying an instance of the FeeLib contract and linking it to the mock LZEndpoint
        myStargate = await (
            await ethers.getContractFactory('StargatePool')
        ).deploy('USDC LP Token', 'USDCLP', mockEndpoint.address, 18, 6, mockEndpoint.address, owner.address)
        otherStargate = await (
            await ethers.getContractFactory('StargatePool')
        ).deploy('USDC LP Token', 'USDCLP', mockEndpoint.address, 18, 6, mockEndpoint.address, owner.address)

        // Deploying an instance of the FeeLib contract and linking it to the Stargate
        myFeeLib = await (await ethers.getContractFactory('FeeLibV1')).deploy(myStargate.address)
        otherFeeLib = await (await ethers.getContractFactory('FeeLibV1')).deploy(otherStargate.address)
    })

    it('should configure the contract', async () => {
        const sdkFactory = createFeeLibV1Factory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myFeeLib.attach(address),
        }))
        const paused = true
        const feeConfig: FeeConfig = {
            zone1UpperBound: 10n,
            zone2UpperBound: 20n,
            zone1FeeMillionth: 1n,
            zone2FeeMillionth: 2n,
            zone3FeeMillionth: 3n,
            rewardMillionth: 4n,
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myFeeLib.address,
        }
        const remotePoint: OmniPoint = {
            eid: EndpointId.APTOS_SANDBOX,
            address: otherFeeLib.address,
        }
        const graph: FeeLibV1OmniGraph = new OmniGraphBuilder()
            .addNodes({
                point: myPoint,
            })
            .addNodes({
                point: remotePoint,
            })
            .addEdges({
                vector: {
                    from: myPoint,
                    to: remotePoint,
                },
                config: {
                    paused: paused,
                    feeConfig: feeConfig,
                },
            }).graph as FeeLibV1OmniGraph

        const configTxs = await configureFeeLibV1(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myFeeLib.address })
        expect(await sdk.getFeeConfig(dstEid)).to.deep.equal(feeConfig)
        expect(await sdk.getPaused(dstEid)).to.equal(paused)
    })

    it('should return no Txs when configuration matches', async () => {
        const sdkFactory = createFeeLibV1Factory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myFeeLib.attach(address),
        }))
        const paused = true
        const feeConfig: FeeConfig = {
            zone1UpperBound: 10n,
            zone2UpperBound: 20n,
            zone1FeeMillionth: 1n,
            zone2FeeMillionth: 2n,
            zone3FeeMillionth: 3n,
            rewardMillionth: 4n,
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myFeeLib.address,
        }
        const remotePoint: OmniPoint = {
            eid: EndpointId.APTOS_SANDBOX,
            address: otherFeeLib.address,
        }
        const graph: FeeLibV1OmniGraph = new OmniGraphBuilder()
            .addNodes({
                point: myPoint,
            })
            .addNodes({
                point: remotePoint,
            })
            .addEdges({
                vector: {
                    from: myPoint,
                    to: remotePoint,
                },
                config: {
                    paused: paused,
                    feeConfig: feeConfig,
                },
            }).graph as FeeLibV1OmniGraph

        const configTxs = await configureFeeLibV1(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureFeeLibV1(graph, sdkFactory)).to.be.empty
    })
})

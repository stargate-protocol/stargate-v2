import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { FeeLibV1 } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { FeeConfig } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { EndpointId } from '@layerzerolabs/lz-definitions'

const dstEid = EndpointId.APTOS_SANDBOX

describe('FeeLibV1/sdk', () => {
    // Declaration of variables to be used in the test suite
    let endpointV2Mock: ContractFactory
    let myFeeLib: Contract
    let myStargate: Contract
    let mockEndpoint: Contract
    let owner: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let sdk: FeeLibV1

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner, endpointOwner] = await ethers.getSigners()

        // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
        // and its artifacts are connected as external artifacts to this project
        //
        // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts
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

        // Deploying an instance of the FeeLib contract and linking it to the Stargate
        myFeeLib = await (await ethers.getContractFactory('FeeLibV1')).deploy(myStargate.address)

        sdk = new FeeLibV1({ eid: EndpointId.ETHEREUM_V2_SANDBOX, contract: myFeeLib })
    })

    describe('setFeeConfig', () => {
        it('should set the fee config', async () => {
            const config: FeeConfig = {
                zone1UpperBound: 10n,
                zone2UpperBound: 20n,
                zone1FeeMillionth: 1n,
                zone2FeeMillionth: 2n,
                zone3FeeMillionth: 3n,
                rewardMillionth: 4n,
            }

            const tx = await sdk.setFeeConfig(
                dstEid,
                config.zone1UpperBound,
                config.zone2UpperBound,
                config.zone1FeeMillionth,
                config.zone2FeeMillionth,
                config.zone3FeeMillionth,
                config.rewardMillionth
            )
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getFeeConfig(dstEid)).to.deep.equal(config)
        })
    })

    describe('setPaused', () => {
        it('should set the paused state', async () => {
            const paused = true

            const tx = await sdk.setPaused(dstEid, paused)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getPaused(dstEid)).to.equal(paused)
        })
    })
})

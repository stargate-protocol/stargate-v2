import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createTreasurerFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { TreasurerOmniGraph, configureTreasurer } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Treasurer/configurator', () => {
    // Declaration of variables to be used in the test suite
    let treasurer: Contract
    let owner: SignerWithAddress
    let admin: SignerWithAddress

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner, admin] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying an instance of the Stargate contract and linking it to the mock LZEndpoint
        treasurer = await (await ethers.getContractFactory('Treasurer')).deploy(owner.address, owner.address)
    })

    it('should configure the contract', async () => {
        const sdkFactory = createTreasurerFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: treasurer.attach(address),
        }))

        const config = {
            '0x0000000000000000000000000000000000000001': true,
            '0x0000000000000000000000000000000000000002': false,
            '0x0000000000000000000000000000000000000003': true,
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: treasurer.address,
        }
        const graph: TreasurerOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                admin: admin.address,
                assets: config,
            },
        }).graph as TreasurerOmniGraph

        const configTxs = await configureTreasurer(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: treasurer.address })

        expect(await sdk.getAdmin()).to.deep.equal(admin.address)

        for (const [asset, managed] of Object.entries(config)) {
            expect(await sdk.getAsset(asset)).to.deep.equal(managed)
        }
    })

    it('should return no Txs when configuration matches', async () => {
        const sdkFactory = createTreasurerFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: treasurer.attach(address),
        }))

        const config = {
            '0x0000000000000000000000000000000000000001': true,
            '0x0000000000000000000000000000000000000002': false,
            '0x0000000000000000000000000000000000000003': true,
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: treasurer.address,
        }
        const graph: TreasurerOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                admin: admin.address,
                assets: config,
            },
        }).graph as TreasurerOmniGraph

        const configTxs = await configureTreasurer(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: treasurer.address })

        expect(await sdk.getAdmin()).to.deep.equal(admin.address)

        for (const [asset, managed] of Object.entries(config)) {
            expect(await sdk.getAsset(asset)).to.deep.equal(managed)
        }

        expect(await configureTreasurer(graph, sdkFactory)).to.empty
    })
})

import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createBlacklistableFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { BlacklistableOmniGraph, configureBlacklistable } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Blacklistable/configurator', () => {
    // Declaration of variables to be used in the test suite
    let myBlacklistable: Contract
    let owner: SignerWithAddress

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying an instance of the Blacklistable contract
        myBlacklistable = await (await ethers.getContractFactory('BlacklistableMock')).deploy()
    })

    it('should configure the contract', async () => {
        const sdkFactory = createBlacklistableFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myBlacklistable.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myBlacklistable.address,
        }
        const graph: BlacklistableOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                blacklister: owner.address,
            },
        }).graph as BlacklistableOmniGraph

        const configTxs = await configureBlacklistable(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myBlacklistable.address })
        expect(await sdk.getBlacklister()).to.equal(owner.address)
    })

    it('should return no Txs when configurations match', async () => {
        const sdkFactory = createBlacklistableFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myBlacklistable.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myBlacklistable.address,
        }
        const graph: BlacklistableOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                blacklister: owner.address,
            },
        }).graph as BlacklistableOmniGraph

        const configTxs = await configureBlacklistable(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureBlacklistable(graph, sdkFactory)).to.be.empty
    })
})

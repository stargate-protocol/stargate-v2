import '@nomiclabs/hardhat-ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Pausable, createPausableFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { PausableOmniGraph, configurePausable } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Pauseable/configurator', () => {
    // Declaration of variables to be used in the test suite
    let myPausable: Contract
    let owner: SignerWithAddress

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying an instance of the Pauseable contract
        myPausable = await (await ethers.getContractFactory('Pausable')).deploy()
    })

    it('should configure the contract', async () => {
        const sdkFactory = createPausableFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myPausable.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myPausable.address,
        }
        const graph: PausableOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                pauser: owner.address,
            },
        }).graph as PausableOmniGraph

        const configTxs = await configurePausable(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myPausable.address })
        expect(await sdk.getPauser()).to.equal(owner.address)
    })

    it('should return no Txs when configurations match', async () => {
        const sdkFactory = (from: OmniPoint) =>
            new Pausable({ eid: from.eid, contract: myPausable.attach(from.address) })

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myPausable.address,
        }
        const graph: PausableOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                pauser: owner.address,
            },
        }).graph as PausableOmniGraph

        const configTxs = await configurePausable(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configurePausable(graph, sdkFactory)).to.be.empty
    })
})

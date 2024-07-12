import '@nomiclabs/hardhat-ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createRescuableFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { RescuableOmniGraph, configureRescuable } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Rescuable/configurator', () => {
    // Declaration of variables to be used in the test suite
    let myRescuable: Contract
    let owner: SignerWithAddress

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying an instance of the Rescuable contract
        myRescuable = await (await ethers.getContractFactory('Rescuable')).deploy()
    })

    it('should configure the contract', async () => {
        const sdkFactory = createRescuableFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myRescuable.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myRescuable.address,
        }
        const graph: RescuableOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                rescuer: owner.address,
            },
        }).graph as RescuableOmniGraph

        const configTxs = await configureRescuable(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myRescuable.address })
        expect(await sdk.getRescuer()).to.equal(owner.address)
    })

    it('should return no Txs when configurations match', async () => {
        const sdkFactory = createRescuableFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myRescuable.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myRescuable.address,
        }
        const graph: RescuableOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                rescuer: owner.address,
            },
        }).graph as RescuableOmniGraph

        const configTxs = await configureRescuable(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureRescuable(graph, sdkFactory)).to.be.empty
    })
})

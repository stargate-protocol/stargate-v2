import '@nomiclabs/hardhat-ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Pausable } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Pauseable/sdk', () => {
    // Declaration of variables to be used in the test suite
    let myPauseable: Contract
    let owner: SignerWithAddress
    let alice: SignerWithAddress
    let sdk: Pausable

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner, alice] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying an instance of the Pauseable contract
        myPauseable = await (await ethers.getContractFactory('Pausable')).deploy()

        sdk = new Pausable({ eid: EndpointId.ETHEREUM_V2_SANDBOX, contract: myPauseable })
    })

    describe('getPauser', () => {
        it('should get 0x0 address for pauser because it was not set', async () => {
            expect(await sdk.getPauser()).to.equal('0x0000000000000000000000000000000000000000')
        })
    })

    describe('setPauser', () => {
        it('should set pauser', async () => {
            const tx = await sdk.setPauser(alice.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await sdk.getPauser()).to.equal(alice.address)
        })
    })

    describe('isPaused', () => {
        it('should return false if not paused', async () => {
            expect(await sdk.isPaused()).to.equal(false)
        })
    })

    describe('setPaused', () => {
        it('should set paused true', async () => {
            const setPauserTx = await sdk.setPauser(owner.address)
            await owner.sendTransaction({
                to: setPauserTx.point.address,
                data: setPauserTx.data,
            })

            const setPausedTx = await sdk.setPaused(true)
            await owner.sendTransaction({
                to: setPausedTx.point.address,
                data: setPausedTx.data,
            })

            expect(await sdk.isPaused()).to.equal(true)
        })

        it('should set paused false', async () => {
            const setPauserTx = await sdk.setPauser(owner.address)
            await owner.sendTransaction({
                to: setPauserTx.point.address,
                data: setPauserTx.data,
            })

            const setPausedTx = await sdk.setPaused(false)
            await owner.sendTransaction({
                to: setPausedTx.point.address,
                data: setPausedTx.data,
            })

            expect(await sdk.isPaused()).to.equal(false)
        })
    })
})

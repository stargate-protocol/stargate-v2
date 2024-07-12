import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Blacklistable } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Blacklistable/sdk', () => {
    // Declaration of variables to be used in the test suite
    let myBlacklistable: Contract
    let owner: SignerWithAddress
    let alice: SignerWithAddress
    let sdk: Blacklistable

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner, alice] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying an instance of the Blacklistable contract
        myBlacklistable = await (await ethers.getContractFactory('BlacklistableMock')).deploy()

        sdk = new Blacklistable({ eid: EndpointId.ETHEREUM_V2_SANDBOX, contract: myBlacklistable })
    })

    describe('getBlacklister', () => {
        it('should get blacklister', async () => {
            expect(await sdk.getBlacklister()).to.equal(owner.address)
        })
    })

    describe('setBlacklister', () => {
        it('should set blacklister', async () => {
            const tx = await sdk.setBlacklister(alice.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await sdk.getBlacklister()).to.equal(alice.address)
        })
    })

    describe('isBlacklisted', () => {
        it('should return false if not black listed', async () => {
            expect(await sdk.isBlacklisted(alice.address)).to.equal(false)
        })
    })

    describe('setBlacklisted', () => {
        it('should set black list address to true', async () => {
            const tx = await sdk.setBlacklisted(alice.address, true)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await sdk.isBlacklisted(alice.address)).to.equal(true)
        })

        it('should set black list address to false', async () => {
            const tx = await sdk.setBlacklisted(alice.address, false)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await sdk.isBlacklisted(alice.address)).to.equal(false)
        })
    })
})

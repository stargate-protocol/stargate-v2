import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Treasurer } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Treasurer/sdk', () => {
    // Declaration of variables to be used in the test suite
    let myTreasurer: Contract
    let owner: SignerWithAddress
    let admin: SignerWithAddress
    let otherAdmin: SignerWithAddress
    let asset: SignerWithAddress
    let sdk: Treasurer

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner, admin, otherAdmin, asset] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        myTreasurer = await (await ethers.getContractFactory('Treasurer')).deploy(owner.address, admin.address)

        sdk = new Treasurer({ eid: EndpointId.ETHEREUM_SANDBOX, contract: myTreasurer })
    })

    describe('setAdmin', () => {
        it('should set the admin', async () => {
            const tx = await sdk.setAdmin(otherAdmin.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getAdmin()).to.equal(otherAdmin.address)
        })
    })

    describe('setAsset', () => {
        it('should set the admin', async () => {
            const tx = await sdk.setAsset(asset.address, true)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getAsset(asset.address)).to.equal(true)
        })
    })
})

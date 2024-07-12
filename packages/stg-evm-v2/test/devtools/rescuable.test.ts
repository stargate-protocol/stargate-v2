import '@nomiclabs/hardhat-ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Rescuable } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Rescuable/sdk', () => {
    // Declaration of variables to be used in the test suite
    let myRescuable: Contract
    let owner: SignerWithAddress
    let token: Contract
    let alice: SignerWithAddress
    let sdk: Rescuable

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner, alice] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Deploying an instance of the Rescuable contract
        myRescuable = await (await ethers.getContractFactory('Rescuable')).deploy()

        token = await (await ethers.getContractFactory('ERC20Token')).deploy('Mock', 'MCK', 6)

        sdk = new Rescuable({ eid: EndpointId.ETHEREUM_V2_SANDBOX, contract: myRescuable })
    })

    describe('getRescuer', () => {
        it('should get 0x0 address for rescuer because it was not set', async () => {
            expect(await sdk.getRescuer()).to.equal('0x0000000000000000000000000000000000000000')
        })
    })

    describe('setRescuer', () => {
        it('should set rescuer', async () => {
            const tx = await sdk.setRescuer(alice.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await sdk.getRescuer()).to.equal(alice.address)
        })
    })

    describe('rescueERC20', () => {
        it('should rescue an ERC20', async () => {
            await token.mint(myRescuable.address, ethers.utils.parseEther('1'))
            expect(await token.balanceOf(myRescuable.address)).to.equal(ethers.utils.parseEther('1'))
            expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('10000'))

            const setRescuerTx = await sdk.setRescuer(owner.address)
            await owner.sendTransaction({
                to: setRescuerTx.point.address,
                data: setRescuerTx.data,
            })

            const rescueERC20Tx = await sdk.rescueERC20(
                token.address,
                owner.address,
                ethers.utils.parseEther('1').toBigInt()
            )
            await owner.sendTransaction({
                to: rescueERC20Tx.point.address,
                data: rescueERC20Tx.data,
            })

            expect(await token.balanceOf(myRescuable.address)).to.equal(0)
            expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('10001'))
        })
    })
})

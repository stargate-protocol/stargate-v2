import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Staking } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Staking/sdk', () => {
    // Declaration of variables to be used in the test suite
    let myStaking: Contract
    let owner: SignerWithAddress
    let token: Contract
    let rewarder: Contract
    let sdk: Staking

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        myStaking = await (await ethers.getContractFactory('StargateStaking')).deploy()

        token = await (await ethers.getContractFactory('ERC20Token')).deploy('Mock', 'MCK', 6)

        rewarder = await (await ethers.getContractFactory('StargateMultiRewarder')).deploy(myStaking.address)

        sdk = new Staking({ eid: EndpointId.ETHEREUM_SANDBOX, contract: myStaking })
    })

    describe('setPools', () => {
        it('should set the pools', async () => {
            const tx = await sdk.setPool(token.address, rewarder.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect(await sdk.getPool(token.address)).to.equal(rewarder.address)
        })
    })
})

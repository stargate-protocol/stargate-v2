import '@nomicfoundation/hardhat-chai-matchers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers, upgrades } from 'hardhat'

describe('Upgrades', async () => {
    it('an upgraded version of the token can have its name and symbol changed but keep the same balance state', async () => {
        const TetherToken = await ethers.getContractFactory('TetherToken')
        const ExampleUpgradedToken = await ethers.getContractFactory('ExampleUpgradedToken')

        const [owner] = await ethers.getSigners()

        // Deploy the first version of the contract (TetherToken)
        const tetherV1: Contract = await upgrades.deployProxy(TetherToken, ['GreatBritishTether', 'GBPT', 6], {
            unsafeAllow: ['constructor'],
        })

        const name1 = await tetherV1.name()
        expect(name1).to.equal('GreatBritishTether')

        await tetherV1.mint(owner.getAddress(), 1234567)

        // Ensure that the new function doesn't exist in V1
        try {
            await tetherV1.newFunctionNotPreviouslyDefined()
        } catch (e) {
            expect(e.toString()).to.equal('TypeError: tetherV1.newFunctionNotPreviouslyDefined is not a function')
        }

        // Upgrade the contract to V2 (ExampleUpgradedToken)
        const tetherV2: Contract = await upgrades.upgradeProxy(tetherV1.address, ExampleUpgradedToken, {
            unsafeAllow: ['constructor'],
        })

        const name2 = await tetherV2.name()
        expect(name2).to.equal(name1) // Ensure name remains unchanged

        const balance = await tetherV2.balanceOf(owner.getAddress())
        expect(balance.toString()).to.equal('1234567') // Ensure balance is retained

        // Call the new function introduced in V2
        const bool = await tetherV2.newFunctionNotPreviouslyDefined()
        expect(bool).to.equal(true)
    })
})

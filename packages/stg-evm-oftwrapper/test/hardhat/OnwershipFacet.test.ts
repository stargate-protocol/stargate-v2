import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { addFacet } from './utils'

describe('OwnershipFacet Test', function () {
    // Declaration of variables to be used in the test suite
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let diamond: Contract
    let ownershipFacet: Contract

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        ;[ownerA, ownerB] = await ethers.getSigners()

        // Initial facets
        const FacetNames = ['DiamondCutFacet', 'DiamondLoupeFacet', 'OwnershipFacet']
        const facetCuts = []
        for (const FacetName of FacetNames) {
            const Facet = await ethers.getContractFactory(FacetName)
            const facet = await Facet.deploy()
            await facet.deployed()
            facetCuts.push(addFacet(facet))
        }

        // Setting arguments that will be used in the diamond constructor
        const diamondArgs = {
            owner: ownerA.address,
            init: ethers.constants.AddressZero,
            initCalldata: [],
        }

        // Deploy the diamond with initial facets.
        diamond = await (await ethers.getContractFactory('Diamond')).deploy(facetCuts, diamondArgs)

        ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamond.address) // Impose the OwnershipFacet on the Diamond address
    })

    it('owner() should return owner', async function () {
        expect(await ownershipFacet.owner()).to.be.eq(ownerA.address)
    })

    it('transferOwnership() should change owner', async function () {
        expect(await ownershipFacet.owner()).to.be.eq(ownerA.address)
        await ownershipFacet.transferOwnership(ownerB.address)
        expect(await ownershipFacet.owner()).to.be.eq(ownerB.address)
    })

    it('transferOwnership() should not allow somebody else', async function () {
        await expect(ownershipFacet.connect(ownerB).transferOwnership(ownerB.address)).to.be.revertedWithCustomError(
            ownershipFacet,
            'NotContractOwner'
        )
    })
})

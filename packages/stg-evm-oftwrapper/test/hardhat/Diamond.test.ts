import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { FacetCut } from 'hardhat-deploy/dist/types'

import { addFacet } from './utils'

describe('Diamond Test', function () {
    // Declaration of variables to be used in the test suite
    let ownerA: SignerWithAddress
    let diamond: Contract
    let unexistingFacet: Contract

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        ;[ownerA] = await ethers.getSigners()

        // Initial facets
        const FacetNames: string[] = ['DiamondCutFacet', 'DiamondLoupeFacet', 'OwnershipFacet']
        const facetCuts: FacetCut[] = []
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

        unexistingFacet = await ethers.getContractAt('OFTFeesFacet', diamond.address) // Impose the OFTFeesFacet on the Diamond address
    })

    it('calls should revert when the function is not found', async function () {
        await expect(unexistingFacet.defaultBps()).to.be.revertedWithCustomError(diamond, 'FunctionNotFound')
    })
})

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { FacetCut } from 'hardhat-deploy/dist/types'

import { addFacet } from './utils'

describe('OFTFees Initializer Test', function () {
    // Declaration of variables to be used in the test suite
    let ownerA: SignerWithAddress
    let diamond: Contract
    let OFTFeesFacet: Contract

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        ;[ownerA] = await ethers.getSigners()

        // Initial facets
        const FacetNames = ['DiamondCutFacet', 'DiamondLoupeFacet', 'OwnershipFacet']
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
    })

    it('init() should change the defaultBps', async function () {
        const oftFeesInitialBps = 128
        const oftFeesInitializer = await (await ethers.getContractFactory('OFTFeesInit')).deploy()
        const oftInitIface = new ethers.utils.Interface(['function init(uint256 initialBps)'])
        const initCalldata = oftInitIface.encodeFunctionData('init', [oftFeesInitialBps])

        const oftFeesContract = await (await ethers.getContractFactory('OFTFeesFacet')).deploy()
        const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address)
        await diamondCutFacet.diamondCut([addFacet(oftFeesContract)], oftFeesInitializer.address, initCalldata)

        OFTFeesFacet = await ethers.getContractAt('OFTFeesFacet', diamond.address) // Impose the OFTFeesFacet on the Diamond address

        expect(await OFTFeesFacet.defaultBps()).to.eq(oftFeesInitialBps)
    })

    it('init() should be below BPS_DENOMINATOR', async function () {
        const oftFeesInitialBps = 10000 + 1
        const oftFeesInitializer = await (await ethers.getContractFactory('OFTFeesInit')).deploy()
        const oftInitIface = new ethers.utils.Interface(['function init(uint256 initialBps)'])
        const initCalldata = oftInitIface.encodeFunctionData('init', [oftFeesInitialBps])

        const oftFeesContract = await (await ethers.getContractFactory('OFTFeesFacet')).deploy()
        const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address)
        await expect(
            diamondCutFacet.diamondCut([addFacet(oftFeesContract)], oftFeesInitializer.address, initCalldata)
        ).to.be.revertedWith('OFTWrapper: defaultBps >= 100%')
    })
})

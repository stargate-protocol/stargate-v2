import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { FacetCut, FacetCutAction } from 'hardhat-deploy/dist/types'

import { addFacet, getSelectors, mvFacet, rmFacet } from './utils'

describe('DiamondCutFacet Test', function () {
    // Declaration of variables to be used in the test suite
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let diamond: Contract
    let diamondCutFacet: Contract

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        ;[ownerA, ownerB] = await ethers.getSigners()

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

        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address) // Impose the DiamondCutFacet on the Diamond address
    })

    it('rmFacet() should not allow deleting facets by owner', async function () {
        await expect(
            diamondCutFacet.diamondCut([rmFacet(diamondCutFacet)], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'IncorrectFacetCutAction')
    })

    it('mvFacet() should not allow replacing facets by owner', async function () {
        await expect(
            diamondCutFacet.diamondCut([mvFacet(diamondCutFacet)], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'IncorrectFacetCutAction')
    })

    it('rmFacet() should not allow deleting facets by somebody else', async function () {
        await expect(
            diamondCutFacet.connect(ownerB).diamondCut([rmFacet(diamondCutFacet)], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'NotContractOwner')
    })

    it('mvFacet() should not allow replacing facets by somebody else', async function () {
        await expect(
            diamondCutFacet.connect(ownerB).diamondCut([mvFacet(diamondCutFacet)], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'NotContractOwner')
    })

    it('addFacet() should allow adding facets by owner', async function () {
        const oftSenderV1Facet = await (await ethers.getContractFactory('OFTSenderV1Facet')).deploy()
        await oftSenderV1Facet.deployed()

        const tx = await diamondCutFacet.diamondCut([addFacet(oftSenderV1Facet)], ethers.constants.AddressZero, [])
        await tx.wait()
    })

    it('addFacet() should not allow adding facets by somebody else', async function () {
        const oftSenderV1Facet = await (await ethers.getContractFactory('OFTSenderV1Facet')).deploy()
        await oftSenderV1Facet.deployed()

        await expect(
            diamondCutFacet.connect(ownerB).diamondCut([addFacet(oftSenderV1Facet)], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'NotContractOwner')
    })

    it('addFacet() should add facets when diamond is cut', async function () {
        const oftSenderV1Facet = await (await ethers.getContractFactory('OFTSenderV1Facet')).deploy()
        await oftSenderV1Facet.deployed()

        await diamondCutFacet.diamondCut([addFacet(oftSenderV1Facet)], ethers.constants.AddressZero, [])

        const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamond.address)

        expect(await diamondLoupeFacet.facetAddresses()).to.contain(oftSenderV1Facet.address)
        for (const selector of getSelectors(oftSenderV1Facet)) {
            expect(await diamondLoupeFacet.facetAddress(selector)).to.not.eq(ethers.constants.AddressZero)
        }
    })

    it('addFacet() should not add facets that already exist', async function () {
        const oftSenderV1Facet = await (await ethers.getContractFactory('OFTSenderV1Facet')).deploy()
        await oftSenderV1Facet.deployed()

        await diamondCutFacet.diamondCut([addFacet(oftSenderV1Facet)], ethers.constants.AddressZero, [])

        await expect(
            diamondCutFacet.diamondCut([addFacet(oftSenderV1Facet)], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'CannotAddFunctionToDiamondThatAlreadyExists')
    })

    it('addFacet() should not add facets with no code', async function () {
        const oftSenderV1Facet = await ethers.getContractAt('OFTSenderV1Facet', ownerA.address)

        await expect(
            diamondCutFacet.diamondCut([addFacet(oftSenderV1Facet)], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'NoBytecodeAtAddress')
    })

    it('addFacet() should not add facets pointing to 0x00', async function () {
        const oftSenderV1Facet = await ethers.getContractAt('OFTSenderV1Facet', ethers.constants.AddressZero)

        await expect(
            diamondCutFacet.diamondCut([addFacet(oftSenderV1Facet)], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'CannotAddSelectorsToZeroAddress')
    })

    it('addFacet() should not add facets with no selectors', async function () {
        const oftSenderV1Facet = await (await ethers.getContractFactory('OFTSenderV1Facet')).deploy()
        await oftSenderV1Facet.deployed()

        const addFacetCommand = {
            facetAddress: oftSenderV1Facet.address,
            action: FacetCutAction.Add,
            functionSelectors: [],
        }

        await expect(
            diamondCutFacet.diamondCut([addFacetCommand], ethers.constants.AddressZero, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'NoSelectorsProvidedForFacetForCut')
    })

    it('addFacet() should revert when the initializer reverts', async function () {
        const revertingInitializer = await (await ethers.getContractFactory('RevertingInit')).deploy()
        const oftStakerContract = await (await ethers.getContractFactory('OFTFeesFacet')).deploy()

        await expect(
            diamondCutFacet.diamondCut([addFacet(oftStakerContract)], revertingInitializer.address, [])
        ).to.be.revertedWithCustomError(diamondCutFacet, 'InitializationFunctionReverted')
    })
})

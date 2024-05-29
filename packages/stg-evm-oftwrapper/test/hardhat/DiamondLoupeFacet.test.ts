import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { FacetCut } from 'hardhat-deploy/dist/types'

import { addFacet, getSelectors } from './utils'

describe('DiamondLoupeFacet Test', function () {
    // Declaration of variables to be used in the test suite
    let ownerA: SignerWithAddress
    let diamond: Contract
    let diamondLoupeFacet: Contract
    let facets: Contract[]

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        ;[ownerA] = await ethers.getSigners()

        // Initial facets
        const FacetNames: string[] = ['DiamondCutFacet', 'DiamondLoupeFacet', 'OwnershipFacet']
        const facetCuts: FacetCut[] = []
        facets = []
        for (const FacetName of FacetNames) {
            const Facet = await ethers.getContractFactory(FacetName)
            const facet = await Facet.deploy()
            await facet.deployed()
            facetCuts.push(addFacet(facet))
            facets.push(facet)
        }

        // Setting arguments that will be used in the diamond constructor
        const diamondArgs = {
            owner: ownerA.address,
            init: ethers.constants.AddressZero,
            initCalldata: [],
        }

        // Deploy the diamond with initial facets.
        diamond = await (await ethers.getContractFactory('Diamond')).deploy(facetCuts, diamondArgs)

        diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamond.address) // Impose the DiamondLoupeFacet on the Diamond address
    })

    it('facetAddresses() should return the facets', async function () {
        for (const facet of facets) {
            expect(await diamondLoupeFacet.facetAddresses()).to.contain(facet.address)
        }
    })

    it('facetAddress() should return the address', async function () {
        for (const facet of facets) {
            for (const selector of getSelectors(facet)) {
                expect(await diamondLoupeFacet.facetAddress(selector)).to.eq(facet.address)
            }
        }
    })

    it('facetFunctionSelectors() should return the selectors', async function () {
        for (const facet of facets) {
            for (const selector of getSelectors(facet)) {
                expect(await diamondLoupeFacet.facetFunctionSelectors(facet.address)).to.contain(selector)
            }
        }
    })

    it('facets() should return the selectors', async function () {
        const facetSelectors = await diamondLoupeFacet.facets()
        const facetMap = new Map<string, string[]>()
        for (const facet of facets) {
            facetMap.set(facet.address, getSelectors(facet))
        }

        for (const facet of facetSelectors) {
            expect([...facetMap.keys()]).to.contain(facet.facetAddress)
        }
    })
})

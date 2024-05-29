import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { FacetCut } from 'hardhat-deploy/dist/types'

import { addFacet, encodeDataWithoutValue } from './utils'

describe('oftFeesFacet Test', function () {
    // Declaration of variables to be used in the test suite
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let oftContract: Contract
    let diamond: Contract
    let oftFeesFacet: Contract
    let oftFeesInitialBps: number

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        ;[ownerA, ownerB] = await ethers.getSigners()

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

        oftFeesInitialBps = 2500 // 25%

        // Deploy this facet
        const oftFeesInitializer = await (await ethers.getContractFactory('OFTFeesInit')).deploy()
        const oftInitIface = new ethers.utils.Interface(['function init(uint256 initialBps)'])
        const initCalldata = oftInitIface.encodeFunctionData('init', [oftFeesInitialBps])

        const oftFeesContract = await (await ethers.getContractFactory('OFTFeesFacet')).deploy()
        const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address)
        await diamondCutFacet.diamondCut([addFacet(oftFeesContract)], oftFeesInitializer.address, initCalldata)

        oftContract = await (await ethers.getContractFactory('MockOFT')).deploy()

        oftFeesFacet = await ethers.getContractAt('OFTFeesFacet', diamond.address) // Impose the oftFeesFacet on the Diamond address
    })

    it('defaultBps() should return the initialized value', async function () {
        expect(await oftFeesFacet.defaultBps()).to.eq(oftFeesInitialBps)
    })

    it('defaultBps() should be public', async function () {
        expect(await oftFeesFacet.connect(ownerB).defaultBps()).to.eq(oftFeesInitialBps)
    })

    it('setDefaultBps() should change the defaultBps by owner', async function () {
        const newValue = 1024

        expect(await oftFeesFacet.defaultBps()).to.eq(oftFeesInitialBps)
        await oftFeesFacet.setDefaultBps(newValue)
        expect(await oftFeesFacet.defaultBps()).to.eq(newValue)
    })

    it('setDefaultBps() should not allow by somebody else', async function () {
        const newValue = 1024

        await expect(oftFeesFacet.connect(ownerB).setDefaultBps(newValue)).to.be.revertedWithCustomError(
            oftFeesFacet,
            'NotContractOwner'
        )
    })

    it('setDefaultBps() should be below BPS_DENOMINATOR', async function () {
        await expect(oftFeesFacet.setDefaultBps(10000 + 1)).to.be.revertedWith('OFTWrapper: defaultBps >= 100%')
    })

    it('oftBps() should return the zero value when unset', async function () {
        expect(await oftFeesFacet.oftBps(oftContract.address)).to.eq(0)
    })

    it('oftBps() should be public', async function () {
        expect(await oftFeesFacet.connect(ownerB).oftBps(oftContract.address)).to.eq(0)
    })

    it('setOFTBps() should change the value by owner', async function () {
        const newValue = 1024

        expect(await oftFeesFacet.oftBps(oftContract.address)).to.eq(0)
        await oftFeesFacet.setOFTBps(oftContract.address, newValue)
        expect(await oftFeesFacet.oftBps(oftContract.address)).to.eq(newValue)
    })

    it('setOFTBps() should not allow by somebody else', async function () {
        const newValue = 1024

        await expect(
            oftFeesFacet.connect(ownerB).setOFTBps(oftContract.address, newValue)
        ).to.be.revertedWithCustomError(oftFeesFacet, 'NotContractOwner')
    })

    it('setOFTBps() should be below BPS_DENOMINATOR', async function () {
        await expect(oftFeesFacet.setOFTBps(oftContract.address, 10000 + 1)).to.be.revertedWith(
            'OFTWrapper: oftBps[_oft] >= 100%'
        )
    })

    it('setOFTBps() can set MAX_UINT', async function () {
        const tx = await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n)
        await tx.wait()
    })

    it('withdrawFees() should not allow somebody else', async function () {
        const withdrawAmount = 10

        await expect(
            oftFeesFacet.connect(ownerB).withdrawFees(oftContract.address, ownerB.address, withdrawAmount)
        ).to.be.revertedWithCustomError(oftFeesFacet, 'NotContractOwner')
    })

    it('withdrawFees() transfers and emits event', async function () {
        const withdrawAmount = 10

        await expect(oftFeesFacet.withdrawFees(oftContract.address, ownerA.address, withdrawAmount))
            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transfer', [ownerA.address, withdrawAmount]))

            .to.emit(oftFeesFacet, 'WrapperFeeWithdrawn')
            .withArgs(oftContract.address, ownerA.address, withdrawAmount)
    })

    it('getAmountAndFees() should return correct fees when there are', async function () {
        const totalAmount = 100
        const callerBps = 1000

        const expectedCallerFee = (totalAmount * callerBps) / 10000
        const expectedWrapperFee = (totalAmount * oftFeesInitialBps) / 10000
        const expectedAmount = totalAmount - expectedCallerFee - expectedWrapperFee

        const [actualAmount, actualWrapperFee, actualCallerFee] = await oftFeesFacet.getAmountAndFees(
            oftContract.address,
            totalAmount,
            callerBps
        )

        expect(actualAmount).to.eq(expectedAmount)
        expect(actualWrapperFee).to.eq(expectedWrapperFee)
        expect(actualCallerFee).to.eq(expectedCallerFee)
    })

    it('getAmountAndFees() should return zero fees when swap is free', async function () {
        const totalAmount = 100
        const callerBps = 0
        const wrapperBps = 0

        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n)

        const expectedCallerFee = (totalAmount * callerBps) / 10000
        const expectedWrapperFee = (totalAmount * wrapperBps) / 10000
        const expectedAmount = totalAmount - expectedCallerFee - expectedWrapperFee

        const [actualAmount, actualWrapperFee, actualCallerFee] = await oftFeesFacet.getAmountAndFees(
            oftContract.address,
            totalAmount,
            callerBps
        )

        expect(actualAmount).to.eq(expectedAmount)
        expect(actualWrapperFee).to.eq(expectedWrapperFee)
        expect(actualCallerFee).to.eq(expectedCallerFee)
    })

    it('getAmountAndFees() should honor custom bps when set', async function () {
        const totalAmount = 100
        const callerBps = 1000
        const wrapperBps = 2000

        await oftFeesFacet.setOFTBps(oftContract.address, wrapperBps)

        const expectedCallerFee = (totalAmount * callerBps) / 10000
        const expectedWrapperFee = (totalAmount * wrapperBps) / 10000
        const expectedAmount = totalAmount - expectedCallerFee - expectedWrapperFee

        const [actualAmount, actualWrapperFee, actualCallerFee] = await oftFeesFacet.getAmountAndFees(
            oftContract.address,
            totalAmount,
            callerBps
        )

        expect(actualAmount).to.eq(expectedAmount)
        expect(actualWrapperFee).to.eq(expectedWrapperFee)
        expect(actualCallerFee).to.eq(expectedCallerFee)
    })

    it('getAmountAndFees() should revert when fees reach 100%', async function () {
        const totalAmount = 100
        const callerBps = 7500

        await expect(oftFeesFacet.getAmountAndFees(oftContract.address, totalAmount, callerBps)).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })
})

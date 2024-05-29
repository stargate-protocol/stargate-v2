import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { Address, FacetCut } from 'hardhat-deploy/dist/types'

import { addFacet, encodeData, encodeDataWithoutValue } from './utils'

describe('OFTSenderV1 Test', function () {
    // Declaration of variables to be used in the test suite
    let ownerA: SignerWithAddress
    let receiverB: SignerWithAddress
    let zeroContract: SignerWithAddress
    let diamond: Contract
    let oftSenderFacet: Contract
    let oftContract: Contract
    let reentrantOftContract: Contract
    let OFTFeesFacet: Contract
    let oftFeesInitialBps: number

    const chainId = 4
    const msgValue = 8000
    const callerFeeBps = 1000
    const sendFromSig = 'sendFrom(address,uint16,bytes,uint256,address,address,bytes)'

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        ;[ownerA, receiverB, zeroContract] = await ethers.getSigners()

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
        const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address)

        // Deploy the FeesInitializer
        oftFeesInitialBps = 2500 // 25% wrapper fees
        const oftFeesInitializer = await (await ethers.getContractFactory('OFTFeesInit')).deploy()
        const oftInitIface = new ethers.utils.Interface(['function init(uint256 initialBps)'])
        const initCalldata = oftInitIface.encodeFunctionData('init', [oftFeesInitialBps])

        // Deploy the feesFacet so we have a bps set and we can charge fees
        const oftFeesContract = await (await ethers.getContractFactory('OFTFeesFacet')).deploy()

        // Add the staker to the diamond
        await diamondCutFacet.diamondCut([addFacet(oftFeesContract)], oftFeesInitializer.address, initCalldata)
        OFTFeesFacet = await ethers.getContractAt('OFTFeesFacet', diamond.address) // Impose the OFTFeesFacet on the Diamond address

        // Deploy the sender contract
        const oftSenderContract = await (await ethers.getContractFactory('OFTSenderV1Facet')).deploy()

        // Add the sender to the diamond
        await diamondCutFacet.diamondCut([addFacet(oftSenderContract)], ethers.constants.AddressZero, [])
        oftSenderFacet = await ethers.getContractAt('OFTSenderV1Facet', diamond.address) // Impose the OFTSenderV1Facet on the Diamond address

        // Deploy a MockOFT
        oftContract = await (await ethers.getContractFactory('MockOFT')).deploy()
        reentrantOftContract = await (await ethers.getContractFactory('ReentrantOFT')).deploy(oftSenderFacet.address)
    })

    it('sendOFT() should transfer value, tokens and pay fees', async function () {
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(ownerA.address, transferValue)
        const payWrapperParams = [ownerA.address, oftSenderFacet.address, wrapperFee]
        const payCallerParams = [ownerA.address, receiverB.address, callerFee]

        await expect(oftSenderFacet.sendOFT(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transferFrom', payWrapperParams))

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transferFrom', payCallerParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendOFT() should transfer value, tokens and pay fees using custom Bps', async function () {
        const wrapperFeeBps = 3000
        const callerFeeBps = 0
        const totalCost = 100
        const wrapperFee = Math.floor((totalCost * wrapperFeeBps) / 10000)
        const callerFee = Math.floor((totalCost * callerFeeBps) / 10000)
        const transferValue = totalCost - wrapperFee - callerFee

        await OFTFeesFacet.setOFTBps(oftContract.address, wrapperFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(ownerA.address, transferValue)

        await expect(oftSenderFacet.sendOFT(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendOFT() should transfer value, no fees', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(ownerA.address, transferValue)

        await expect(oftSenderFacet.sendOFT(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendOFT() should revert with incorrect expectations', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendOFT(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: not enough amountToSwap'
        )
    })

    it('sendOFT() should revert when caller is too expensive', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 10000
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendOFT(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })

    it('sendOFT() should revert when OFT tries to reenter', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(reentrantOftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(oftSenderFacet.sendOFT(...wrapperParams, { value: msgValue })).to.be.revertedWithCustomError(
            oftSenderFacet,
            'ReentrancyGuardReentrantCall'
        )
    })

    it('sendProxyOFT() should transfer value, tokens and pay fees', async function () {
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(oftSenderFacet.address, transferValue)
        const firstApproveParams = [oftContract.address, transferValue]
        const lastApproveParams = [oftContract.address, 0]

        await expect(oftSenderFacet.sendProxyOFT(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', firstApproveParams))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', lastApproveParams))
    })

    it('sendProxyOFT() should transfer value, no fees', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(oftSenderFacet.address, transferValue)
        const firstApproveParams = [oftContract.address, totalCost]
        const lastApproveParams = [oftContract.address, 0]

        await expect(oftSenderFacet.sendProxyOFT(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', firstApproveParams))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', lastApproveParams))
    })

    it('sendProxyOFT() should revert with incorrect expectations', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendProxyOFT(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: not enough amountToSwap'
        )
    })

    it('sendProxyOFT() should revert when caller is too expensive', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 10000
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendProxyOFT(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })

    it('sendProxyOFT() should revert when OFT tries to reenter', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(reentrantOftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(oftSenderFacet.sendProxyOFT(...wrapperParams, { value: msgValue })).to.be.revertedWithCustomError(
            oftSenderFacet,
            'ReentrancyGuardReentrantCall'
        )
    })

    it('sendNativeOFT() should transfer value, tokens and pay fees', async function () {
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(oftSenderFacet.address, transferValue)
        const payCallerParams = [receiverB.address, callerFee]

        await expect(oftSenderFacet.sendNativeOFT(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, 'deposit', totalCost, []))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue - totalCost, sendFromParams))

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transfer', payCallerParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendNativeOFT() should transfer value, no fees', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(oftSenderFacet.address, transferValue)

        await expect(oftSenderFacet.sendNativeOFT(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, 'deposit', totalCost, []))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue - totalCost, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendNativeOFT() should revert with incorrect expectations', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendNativeOFT(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: not enough amountToSwap'
        )
    })

    it('sendNativeOFT() should revert when caller is too expensive', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 10000
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendNativeOFT(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })

    it('sendNativeOFT() should revert when not enough value sent', async function () {
        await OFTFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(oftSenderFacet.sendNativeOFT(...wrapperParams, { value: totalCost - 1 })).to.be.revertedWith(
            'OFTWrapper: not enough value sent'
        )
    })

    it('sendNativeOFT() should revert when OFT tries to reenter', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(reentrantOftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(oftSenderFacet.sendNativeOFT(...wrapperParams, { value: msgValue })).to.be.revertedWithCustomError(
            oftSenderFacet,
            'ReentrancyGuardReentrantCall'
        )
    })

    it('estimateSendFee() should return the right fee', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = [
            oftContract.address,
            chainId,
            receiverB.address,
            totalCost,
            true,
            [],
            { callerBps: callerFeeBps, caller: receiverB.address, partnerId: '0xf0f0' },
        ]

        const [nativeFee, zroFee] = await oftSenderFacet.estimateSendFee(...wrapperParams)
        expect(nativeFee).to.eq(transferValue)
        expect(zroFee).to.eq(20)
    })

    function getSendParams(sender: Address, transferValue: number) {
        return [sender, chainId, receiverB.address, transferValue, ownerA.address, zeroContract.address, []]
    }

    function getFees(wrapperFeeBps: number, callerFeeBps: number): [number, number, number, number] {
        const totalCost = 100
        const wrapperFee = Math.floor((totalCost * wrapperFeeBps) / 10000)
        const callerFee = Math.floor((totalCost * callerFeeBps) / 10000)
        const transferValue = totalCost - wrapperFee - callerFee

        return [totalCost, wrapperFee, callerFee, transferValue]
    }

    function getWrapperParams(sender: Address, totalCost: number, transferValue: number, callerFeeBps: number) {
        return [
            sender,
            chainId,
            receiverB.address,
            totalCost,
            transferValue,
            ownerA.address,
            zeroContract.address,
            [],
            { callerBps: callerFeeBps, caller: receiverB.address, partnerId: '0xf0f0' },
        ]
    }
})

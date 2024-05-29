import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { Address, FacetCut } from 'hardhat-deploy/dist/types'

import { addFacet, encodeData, encodeDataWithoutValue } from './utils'

describe('OFTSenderV2 Test', function () {
    // Declaration of variables to be used in the test suite
    let ownerA: SignerWithAddress
    let receiverB: SignerWithAddress
    let zeroContract: SignerWithAddress
    let diamond: Contract
    let oftSenderFacet: Contract
    let oftContract: Contract
    let reentrantOftContract: Contract
    let oftFeesFacet: Contract
    let oftFeesInitialBps: number

    const chainId = 4
    const msgValue = 8000
    const callerFeeBps = 1000
    const sendFromSig = 'sendFrom(address,uint16,bytes32,uint256,(address,address,bytes))'
    const sendFromFeeSig = 'sendFrom(address,uint16,bytes32,uint256,uint256,(address,address,bytes))'

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

        // Deploy the FeesFacet so we have a bps set and we can charge fees
        const oftFeesContract = await (await ethers.getContractFactory('OFTFeesFacet')).deploy()

        // Add the FeesFacet to the diamond
        await diamondCutFacet.diamondCut([addFacet(oftFeesContract)], oftFeesInitializer.address, initCalldata)
        oftFeesFacet = await ethers.getContractAt('OFTFeesFacet', diamond.address) // Impose the oftFeesFacet on the Diamond address

        // Deploy the sender contract
        const oftSenderContract = await (await ethers.getContractFactory('OFTSenderV2Facet')).deploy()

        // Add the sender to the diamond
        await diamondCutFacet.diamondCut([addFacet(oftSenderContract)], ethers.constants.AddressZero, [])
        oftSenderFacet = await ethers.getContractAt('OFTSenderV2Facet', diamond.address) // Impose the OFTSenderV2Facet on the Diamond address

        // Deploy a MockOFT
        oftContract = await (await ethers.getContractFactory('MockOFT')).deploy()
        reentrantOftContract = await (await ethers.getContractFactory('ReentrantOFT')).deploy(oftSenderFacet.address)
    })

    it('sendOFTV2() should transfer value, tokens and pay fees', async function () {
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(ownerA.address, transferValue)
        const payWrapperParams = [ownerA.address, oftSenderFacet.address, wrapperFee]
        const payCallerParams = [ownerA.address, receiverB.address, callerFee]

        await expect(oftSenderFacet.sendOFTV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transferFrom', payWrapperParams))

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transferFrom', payCallerParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendOFTV2() should transfer value, no fees', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(ownerA.address, transferValue)

        await expect(oftSenderFacet.sendOFTV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendOFTV2() should revert with incorrect expectations', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendOFTV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: not enough amountToSwap'
        )
    })

    it('sendOFTV2() should revert when caller is too expensive', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 10000
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendOFTV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })

    it('sendOFTV2() should revert when OFT tries to reenter', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(reentrantOftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(oftSenderFacet.sendOFTV2(...wrapperParams, { value: msgValue })).to.be.revertedWithCustomError(
            oftSenderFacet,
            'ReentrancyGuardReentrantCall'
        )
    })

    it('sendOFTFeeV2() should transfer value, tokens and pay fees', async function () {
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParamsWithFee(ownerA.address, transferValue, transferValue)
        const payWrapperParams = [ownerA.address, oftSenderFacet.address, wrapperFee]
        const payCallerParams = [ownerA.address, receiverB.address, callerFee]

        await expect(oftSenderFacet.sendOFTFeeV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromFeeSig, msgValue, sendFromParams))

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transferFrom', payWrapperParams))

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transferFrom', payCallerParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendOFTFeeV2() should transfer value, no fees', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParamsWithFee(ownerA.address, totalCost, transferValue)

        await expect(oftSenderFacet.sendOFTFeeV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromFeeSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendOFTFeeV2() should revert when OFT tries to reenter', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(reentrantOftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(oftSenderFacet.sendOFTFeeV2(...wrapperParams, { value: msgValue })).to.be.revertedWithCustomError(
            oftSenderFacet,
            'ReentrancyGuardReentrantCall'
        )
    })

    it('sendOFTFeeV2() should revert with incorrect expectations', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendOFTFeeV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: not enough amountToSwap'
        )
    })

    it('sendOFTFeeV2() should revert when caller is too expensive', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 10000
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendOFTFeeV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })

    it('sendProxyOFTV2() should transfer value, tokens and pay fees', async function () {
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(oftSenderFacet.address, transferValue)
        const firstApproveParams = [oftContract.address, transferValue]
        const lastApproveParams = [oftContract.address, 0]

        await expect(oftSenderFacet.sendProxyOFTV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', firstApproveParams))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', lastApproveParams))
    })

    it('sendProxyOFTV2() should transfer value, no fees', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParams(oftSenderFacet.address, transferValue)
        const firstApproveParams = [oftContract.address, totalCost]
        const lastApproveParams = [oftContract.address, 0]

        await expect(oftSenderFacet.sendProxyOFTV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', firstApproveParams))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', lastApproveParams))
    })

    it('sendProxyOFTV2() should revert when OFT tries to reenter', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(reentrantOftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(
            oftSenderFacet.sendProxyOFTV2(...wrapperParams, { value: msgValue })
        ).to.be.revertedWithCustomError(oftSenderFacet, 'ReentrancyGuardReentrantCall')
    })

    it('sendProxyOFTV2() should revert with incorrect expectations', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendProxyOFTV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: not enough amountToSwap'
        )
    })

    it('sendProxyOFTV2() should revert when caller is too expensive', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 10000
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendProxyOFTV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })

    it('sendProxyOFTFeeV2() should transfer value, tokens and pay fees', async function () {
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParamsWithFee(oftSenderFacet.address, transferValue, transferValue)
        const firstApproveParams = [oftContract.address, transferValue]
        const lastApproveParams = [oftContract.address, 0]

        await expect(oftSenderFacet.sendProxyOFTFeeV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', firstApproveParams))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromFeeSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', lastApproveParams))
    })

    it('sendProxyOFTFeeV2() should transfer value, no fees', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParamsWithFee(oftSenderFacet.address, totalCost, transferValue)
        const firstApproveParams = [oftContract.address, totalCost]
        const lastApproveParams = [oftContract.address, 0]

        await expect(oftSenderFacet.sendProxyOFTFeeV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', firstApproveParams))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromFeeSig, msgValue, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'approve', lastApproveParams))
    })

    it('sendProxyOFTFeeV2() should revert with incorrect expectations', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendProxyOFTFeeV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: not enough amountToSwap'
        )
    })

    it('sendProxyOFTFeeV2() should revert when caller is too expensive', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 10000
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendProxyOFTFeeV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })

    it('sendProxyOFTFeeV2() should revert when OFT tries to reenter', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(reentrantOftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(
            oftSenderFacet.sendProxyOFTFeeV2(...wrapperParams, { value: msgValue })
        ).to.be.revertedWithCustomError(oftSenderFacet, 'ReentrancyGuardReentrantCall')
    })

    it('sendNativeOFTFeeV2() should transfer value, tokens and pay fees', async function () {
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParamsWithFee(oftSenderFacet.address, transferValue, transferValue)
        const payCallerParams = [receiverB.address, callerFee]

        await expect(oftSenderFacet.sendNativeOFTFeeV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, 'deposit', totalCost, []))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromFeeSig, msgValue - totalCost, sendFromParams))

            .to.emit(oftContract, 'MockEventWithoutValue')
            .withArgs(encodeDataWithoutValue(oftContract, 'transfer', payCallerParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendNativeOFTFeeV2() should transfer value, no fees', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, wrapperFee, callerFee, transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)
        const sendFromParams = getSendParamsWithFee(oftSenderFacet.address, totalCost, transferValue)

        await expect(oftSenderFacet.sendNativeOFTFeeV2(...wrapperParams, { value: msgValue }))
            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, 'deposit', totalCost, []))

            .to.emit(oftContract, 'MockEvent')
            .withArgs(encodeData(oftContract, sendFromFeeSig, msgValue - totalCost, sendFromParams))

            .to.emit(oftSenderFacet, 'WrapperFees')
            .withArgs('0xf0f0', oftContract.address, wrapperFee, callerFee)
    })

    it('sendNativeOFTFeeV2() should revert with incorrect expectations', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendNativeOFTFeeV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: not enough amountToSwap'
        )
    })

    it('sendNativeOFTFeeV2() should revert when caller is too expensive', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 10000
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue + 1, callerFeeBps)

        await expect(oftSenderFacet.sendNativeOFTFeeV2(...wrapperParams, { value: msgValue })).to.be.revertedWith(
            'OFTWrapper: Fee bps >= 100%'
        )
    })

    it('sendNativeOFTFeeV2() should revert when not enough value sent', async function () {
        await oftFeesFacet.setOFTBps(oftContract.address, 2n ** 256n - 1n) // Override oftBps to 0
        const callerFeeBps = 0
        const [totalCost, , , transferValue] = getFees(0, callerFeeBps)

        const wrapperParams = getWrapperParams(oftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(oftSenderFacet.sendNativeOFTFeeV2(...wrapperParams, { value: totalCost - 1 })).to.be.revertedWith(
            'OFTWrapper: not enough value sent'
        )
    })

    it('sendNativeOFTFeeV2() should revert when OFT tries to reenter', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = getWrapperParams(reentrantOftContract.address, totalCost, transferValue, callerFeeBps)

        await expect(
            oftSenderFacet.sendNativeOFTFeeV2(...wrapperParams, { value: msgValue })
        ).to.be.revertedWithCustomError(oftSenderFacet, 'ReentrancyGuardReentrantCall')
    })

    it('estimateSendFeeV2() should return the right fee', async function () {
        const [totalCost, , , transferValue] = getFees(oftFeesInitialBps, callerFeeBps)

        const wrapperParams = [
            oftContract.address,
            chainId,
            ethers.utils.hexZeroPad(receiverB.address, 32),
            totalCost,
            true,
            [],
            { callerBps: callerFeeBps, caller: receiverB.address, partnerId: '0xf0f0' },
        ]

        const [nativeFee, zroFee] = await oftSenderFacet.estimateSendFeeV2(...wrapperParams)
        expect(nativeFee).to.eq(transferValue)
        expect(zroFee).to.eq(20)
    })

    function getSendParams(sender: Address, transferValue: number) {
        return [
            sender,
            chainId,
            ethers.utils.hexZeroPad(receiverB.address, 32),
            transferValue,
            { refundAddress: ownerA.address, zroPaymentAddress: zeroContract.address, adapterParams: [] },
        ]
    }

    function getSendParamsWithFee(sender: Address, totalCost: number, transferValue: number) {
        return [
            sender,
            chainId,
            ethers.utils.hexZeroPad(receiverB.address, 32),
            totalCost,
            transferValue,
            { refundAddress: ownerA.address, zroPaymentAddress: zeroContract.address, adapterParams: [] },
        ]
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
            ethers.utils.hexZeroPad(receiverB.address, 32),
            totalCost,
            transferValue,
            { refundAddress: ownerA.address, zroPaymentAddress: zeroContract.address, adapterParams: [] },
            { callerBps: callerFeeBps, caller: receiverB.address, partnerId: '0xf0f0' },
        ]
    }
})

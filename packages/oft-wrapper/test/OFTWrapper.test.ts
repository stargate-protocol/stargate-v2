import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { expect } from "chai"
import { Contract, ContractFactory } from "ethers"
import { ethers } from "hardhat"

describe("OFTWrapper", () => {
    const chainIdSrc = 1
    const chainIdDst = 2
    const name = "OmnichainFungibleToken"
    const symbol = "OFT"
    const partnerId = "0x0003"

    let owner: HardhatEthersSigner
    let caller: HardhatEthersSigner
    let badUser: HardhatEthersSigner
    let oftWrapper: Contract
    let LZEndpointMock: ContractFactory
    let lzEndpointSrcMock: Contract
    let lzEndpointDstMock: Contract

    let OFT: ContractFactory
    let OFTSrc: Contract
    let OFTDst: Contract
    let dstPath, srcPath
    let BP_DENOMINATOR: number
    let MAX_UINT: number

    before(async () => {
        ;[owner, caller, badUser] = await ethers.getSigners()

        LZEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        OFT = await ethers.getContractFactory("MockOFT")
    })

    beforeEach(async function () {
        const OftWrapper = await ethers.getContractFactory("OFTWrapper")
        oftWrapper = await OftWrapper.deploy([0])

        lzEndpointSrcMock = await LZEndpointMock.deploy(chainIdSrc)
        lzEndpointDstMock = await LZEndpointMock.deploy(chainIdDst)

        OFTSrc = await OFT.deploy(name, symbol, lzEndpointSrcMock.address)
        OFTDst = await OFT.deploy(name, symbol, lzEndpointDstMock.address)

        // internal bookkeeping for endpoints (not part of a real deploy, just for this test)
        await (await lzEndpointSrcMock.setDestLzEndpoint(OFTDst.address, lzEndpointDstMock.address)).wait()
        await (await lzEndpointDstMock.setDestLzEndpoint(OFTSrc.address, lzEndpointSrcMock.address)).wait()

        BP_DENOMINATOR = await oftWrapper.BPS_DENOMINATOR()
        MAX_UINT = await oftWrapper.MAX_UINT()

        // set each contracts source address so it can send to each other
        dstPath = ethers.utils.solidityPack(["address", "address"], [OFTDst.address, OFTSrc.address])
        srcPath = ethers.utils.solidityPack(["address", "address"], [OFTSrc.address, OFTDst.address])
        await (await OFTSrc.setTrustedRemote(chainIdDst, dstPath)).wait() // for A, set B
        await (await OFTDst.setTrustedRemote(chainIdSrc, srcPath)).wait() // for B, set A
    })

    it("constructor() - sets default bps properly", async function () {
        const OftWrapper = await ethers.getContractFactory("OFTWrapper")
        oftWrapper = await OftWrapper.deploy(BP_DENOMINATOR - 1)
        expect(await oftWrapper.defaultBps()).to.be.equal(BP_DENOMINATOR - 1)
    })

    it("constructor() - reverts if defaultBps >= 100%", async function () {
        const OftWrapper = await ethers.getContractFactory("OFTWrapper")
        await expect(OftWrapper.deploy(BP_DENOMINATOR)).to.be.revertedWith("OFTWrapper: defaultBps >= 100%")
    })

    it("setDefaultBps()", async function () {
        expect(await oftWrapper.defaultBps()).to.be.equal(0)
        await oftWrapper.setDefaultBps(10)
        expect(await oftWrapper.defaultBps()).to.be.equal(10)
        await oftWrapper.setDefaultBps(BP_DENOMINATOR - 1)
        expect(await oftWrapper.defaultBps()).to.be.equal(BP_DENOMINATOR - 1)
    })

    it("setDefaultBps() - reverts from non owner", async function () {
        await expect(oftWrapper.connect(badUser).setDefaultBps(10)).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("setDefaultBps() - reverts if bps == 100%", async function () {
        await expect(oftWrapper.setDefaultBps(BP_DENOMINATOR)).to.be.revertedWith("OFTWrapper: defaultBps >= 100%")
    })

    it("setOFTBps()", async function () {
        expect(await oftWrapper.oftBps(OFTSrc.address)).to.be.equal(0)
        await oftWrapper.setOFTBps(OFTSrc.address, 10)
        expect(await oftWrapper.oftBps(OFTSrc.address)).to.be.equal(10)
        await oftWrapper.setOFTBps(OFTSrc.address, BP_DENOMINATOR - 1)
        expect(await oftWrapper.oftBps(OFTSrc.address)).to.be.equal(BP_DENOMINATOR - 1)
    })

    it("setOFTBps() - reverts from non owner", async function () {
        await expect(oftWrapper.connect(badUser).setOFTBps(OFTSrc.address, 10)).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("setOFTBps() - reverts if bps == 100%", async function () {
        await expect(oftWrapper.setOFTBps(OFTSrc.address, BP_DENOMINATOR)).to.be.revertedWith("OFTWrapper: oftBps[_oft] >= 100%")
    })

    it("getAmountAndFees() - oftBps override default", async function () {
        const amountToSwap = 10000000
        const oftBps = 10
        const defaultBps = BP_DENOMINATOR - 1
        const callerBps = 100

        await oftWrapper.setOFTBps(OFTSrc.address, oftBps)
        await oftWrapper.setDefaultBps(defaultBps)

        const { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        expect(wrapperFee).to.be.equal((amountToSwap * oftBps) / BP_DENOMINATOR)
        expect(callerFee).to.be.equal((amountToSwap * callerBps) / BP_DENOMINATOR)
        expect(amountToSwap - wrapperFee - callerFee).to.be.equal(amount)
    })

    it("getAmountAndFees() - default is used if oftBps is set to 0", async function () {
        const amountToSwap = 10000000
        const defaultBps = 1000
        const callerBps = 100

        await oftWrapper.setDefaultBps(defaultBps)

        const { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        expect(wrapperFee).to.be.equal((amountToSwap * defaultBps) / BP_DENOMINATOR)
        expect(callerFee).to.be.equal((amountToSwap * callerBps) / BP_DENOMINATOR)
        expect(amountToSwap - wrapperFee - callerFee).to.be.equal(amount)
    })

    it("getAmountAndFees() - MAX_UINT override default bps", async function () {
        const amountToSwap = 10000000
        const defaultBps = 1000
        const callerBps = 100

        await oftWrapper.setDefaultBps(defaultBps)
        await oftWrapper.setOFTBps(OFTSrc.address, MAX_UINT)

        const { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        expect(wrapperFee).to.be.equal(0)
        expect(callerFee).to.be.equal((amountToSwap * callerBps) / BP_DENOMINATOR)
        expect(amountToSwap - wrapperFee - callerFee).to.be.equal(amount)
    })

    it("getAmountAndFees() - reverts if collective bps is over BPS denominator", async function () {
        const amountToSwap = 10000000
        const defaultBps = BP_DENOMINATOR - 1
        const callerBps = 1

        await oftWrapper.setDefaultBps(defaultBps)

        await expect(oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)).to.be.revertedWith("OFTWrapper: Fee bps >= 100%")
    })

    it("sendOFT()", async function () {
        const amountToSwap = 10000000
        const defaultBps = 1000
        const callerBps = 100
        const feeObj = { callerBps, caller: caller.address, partnerId }

        await oftWrapper.setDefaultBps(defaultBps)

        await OFTSrc.mint(owner.address, amountToSwap)

        expect(await OFTSrc.balanceOf(owner.address)).to.be.equal(amountToSwap)
        expect(await OFTDst.balanceOf(owner.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(caller.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(oftWrapper.address)).to.be.equal(0)

        await OFTSrc.approve(oftWrapper.address, amountToSwap)

        const lzFee = (await oftWrapper.estimateSendFee(OFTSrc.address, chainIdDst, owner.address, amountToSwap, false, "0x", feeObj)).nativeFee

        const { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        await oftWrapper.sendOFT(
            OFTSrc.address,
            chainIdDst,
            owner.address,
            amountToSwap,
            0,
            owner.address,
            ethers.constants.AddressZero,
            "0x",
            feeObj,
            { value: lzFee }
        )

        expect(await OFTSrc.balanceOf(owner.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(owner.address)).to.be.equal(amount)
        expect(await OFTSrc.balanceOf(caller.address)).to.be.equal(callerFee)
        expect(await OFTSrc.balanceOf(oftWrapper.address)).to.be.equal(wrapperFee)
    })

    it("sendOFT() - OFTWrapper: amountToSwap < minAmount", async function () {
        const amountToSwap = 10000000
        const defaultBps = 1
        const callerBps = 0
        const feeObj = { callerBps, caller: caller.address, partnerId }

        await oftWrapper.setDefaultBps(defaultBps)
        await OFTSrc.mint(owner.address, amountToSwap)
        await OFTSrc.approve(oftWrapper.address, amountToSwap)
        const lzFee = (await oftWrapper.estimateSendFee(OFTSrc.address, chainIdDst, owner.address, amountToSwap, false, "0x", feeObj)).nativeFee

        const { amount } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        expect(amount).to.be.lt(amountToSwap)

        await expect(
            oftWrapper.sendOFT(
                OFTSrc.address,
                chainIdDst,
                owner.address,
                amountToSwap,
                amountToSwap,
                owner.address,
                ethers.constants.AddressZero,
                "0x",
                feeObj,
                { value: lzFee }
            )
        ).to.be.revertedWith("OFTWrapper: not enough amountToSwap")
    })

    it("withdrawFees()", async function () {
        const amountToSwap = 10000000
        const defaultBps = 1000
        const callerBps = 100
        const feeObj = { callerBps, caller: caller.address, partnerId }

        await oftWrapper.setDefaultBps(defaultBps)
        await OFTSrc.mint(owner.address, amountToSwap)
        await OFTSrc.approve(oftWrapper.address, amountToSwap)
        const lzFee = (await oftWrapper.estimateSendFee(OFTSrc.address, chainIdDst, owner.address, amountToSwap, false, "0x", feeObj)).nativeFee

        const { wrapperFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        await oftWrapper.sendOFT(
            OFTSrc.address,
            chainIdDst,
            owner.address,
            amountToSwap,
            0,
            owner.address,
            ethers.constants.AddressZero,
            "0x",
            feeObj,
            { value: lzFee }
        )

        expect(await OFTSrc.balanceOf(oftWrapper.address)).to.be.equal(wrapperFee)
        expect(await OFTSrc.balanceOf(owner.address)).to.be.equal(0)
        await oftWrapper.withdrawFees(OFTSrc.address, owner.address, wrapperFee)
        expect(await OFTSrc.balanceOf(owner.address)).to.be.equal(wrapperFee)
    })
})

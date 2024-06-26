const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("OFTWrapper:", function () {
    const chainIdSrc = 1
    const chainIdDst = 2
    const name = "OmnichainFungibleToken"
    const symbol = "OFT"
    const partnerId = "0x0003"

    let owner, caller, badUser, OftWrapper, oftWrapper, LZEndpointMock, lzEndpointSrcMock, lzEndpointDstMock
    let OFT, OFTSrc, OFTDst, dstPath, srcPath, BP_DENOMINATOR, MAX_UINT

    before(async function () {
        ;[owner, caller, badUser] = await ethers.getSigners()

        LZEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        OftWrapper = await ethers.getContractFactory("OFTWrapper")
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
        lzEndpointSrcMock.setDestLzEndpoint(OFTDst.address, lzEndpointDstMock.address)
        lzEndpointDstMock.setDestLzEndpoint(OFTSrc.address, lzEndpointSrcMock.address)

        BP_DENOMINATOR = await oftWrapper.BPS_DENOMINATOR()
        MAX_UINT = await oftWrapper.MAX_UINT()

        // set each contracts source address so it can send to each other
        dstPath = ethers.utils.solidityPack(["address", "address"], [OFTDst.address, OFTSrc.address])
        srcPath = ethers.utils.solidityPack(["address", "address"], [OFTSrc.address, OFTDst.address])
        await OFTSrc.setTrustedRemote(chainIdDst, dstPath) // for A, set B
        await OFTDst.setTrustedRemote(chainIdSrc, srcPath) // for B, set A
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
        let amountToSwap = 10000000
        let oftBps = 10
        let defaultBps = BP_DENOMINATOR - 1
        let callerBps = 100

        await oftWrapper.setOFTBps(OFTSrc.address, oftBps)
        await oftWrapper.setDefaultBps(defaultBps)

        let { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        expect(wrapperFee).to.be.equal((amountToSwap * oftBps) / BP_DENOMINATOR)
        expect(callerFee).to.be.equal((amountToSwap * callerBps) / BP_DENOMINATOR)
        expect(amountToSwap - wrapperFee - callerFee).to.be.equal(amount)
    })

    it("getAmountAndFees() - default is used if oftBps is set to 0", async function () {
        let amountToSwap = 10000000
        let defaultBps = 1000
        let callerBps = 100

        await oftWrapper.setDefaultBps(defaultBps)

        let { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        expect(wrapperFee).to.be.equal((amountToSwap * defaultBps) / BP_DENOMINATOR)
        expect(callerFee).to.be.equal((amountToSwap * callerBps) / BP_DENOMINATOR)
        expect(amountToSwap - wrapperFee - callerFee).to.be.equal(amount)
    })

    it("getAmountAndFees() - MAX_UINT override default bps", async function () {
        let amountToSwap = 10000000
        let defaultBps = 1000
        let callerBps = 100

        await oftWrapper.setDefaultBps(defaultBps)
        await oftWrapper.setOFTBps(OFTSrc.address, MAX_UINT)

        let { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

        expect(wrapperFee).to.be.equal((amountToSwap * 0) / BP_DENOMINATOR)
        expect(callerFee).to.be.equal((amountToSwap * callerBps) / BP_DENOMINATOR)
        expect(amountToSwap - wrapperFee - callerFee).to.be.equal(amount)
    })

    it("getAmountAndFees() - reverts if collective bps is over BPS denominator", async function () {
        let amountToSwap = 10000000
        let defaultBps = BP_DENOMINATOR - 1
        let callerBps = 1

        await oftWrapper.setDefaultBps(defaultBps)

        await expect(oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)).to.be.revertedWith("OFTWrapper: Fee bps >= 100%")
    })

    it("sendOFT()", async function () {
        let amountToSwap = 10000000
        let defaultBps = 1000
        let callerBps = 100
        let feeObj = { callerBps, caller: caller.address, partnerId }

        await oftWrapper.setDefaultBps(defaultBps)

        await OFTSrc.mint(owner.address, amountToSwap)

        expect(await OFTSrc.balanceOf(owner.address)).to.be.equal(amountToSwap)
        expect(await OFTDst.balanceOf(owner.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(caller.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(oftWrapper.address)).to.be.equal(0)

        await OFTSrc.approve(oftWrapper.address, amountToSwap)

        const lzFee = (await oftWrapper.estimateSendFee(OFTSrc.address, chainIdDst, owner.address, amountToSwap, false, "0x", feeObj)).nativeFee

        let { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

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
        let amountToSwap = 10000000
        let defaultBps = 1
        let callerBps = 0
        let feeObj = { callerBps, caller: caller.address, partnerId }

        await oftWrapper.setDefaultBps(defaultBps)
        await OFTSrc.mint(owner.address, amountToSwap)
        await OFTSrc.approve(oftWrapper.address, amountToSwap)
        const lzFee = (await oftWrapper.estimateSendFee(OFTSrc.address, chainIdDst, owner.address, amountToSwap, false, "0x", feeObj)).nativeFee

        let { amount } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

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
        let amountToSwap = 10000000
        let defaultBps = 1000
        let callerBps = 100
        let feeObj = { callerBps, caller: caller.address, partnerId }

        await oftWrapper.setDefaultBps(defaultBps)
        await OFTSrc.mint(owner.address, amountToSwap)
        await OFTSrc.approve(oftWrapper.address, amountToSwap)
        const lzFee = (await oftWrapper.estimateSendFee(OFTSrc.address, chainIdDst, owner.address, amountToSwap, false, "0x", feeObj)).nativeFee

        let { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(OFTSrc.address, amountToSwap, callerBps)

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
